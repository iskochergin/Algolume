import os
import psutil
import multiprocessing
import time
from backend.code_exec.get_py_debug_log import get_debug_log


# Custom Exceptions
class TimeoutException(Exception):
    pass


class MemoryLimitException(Exception):
    pass


def monitor_memory_usage(pid, max_mem_mb, stop_event, peak_memory):
    """
    Monitors the memory usage *delta* of the process with the given PID.
    Records the initial RSS, then tracks only additional memory allocations.
    """
    try:
        process = psutil.Process(pid)
        # Capture starting RSS in bytes
        initial_rss = process.memory_info().rss

        while not stop_event.is_set():
            try:
                # Current RSS minus initial RSS, converted to MB
                delta = (process.memory_info().rss - initial_rss) / (1024 * 1024)
                with peak_memory.get_lock():
                    if delta > peak_memory.value:
                        peak_memory.value = delta

                if delta > max_mem_mb:
                    process.terminate()
                    stop_event.set()
                    raise MemoryLimitException(
                        f"Memory delta exceeded {max_mem_mb} MB."
                    )

                time.sleep(0.1)
            except psutil.NoSuchProcess:
                break  # Process has exited
    except Exception as e:
        print(f"[Memory monitor error] {e}")


def get_process_return(queue, code, input_data):
    """
    Executes get_debug_log and pushes its result (or exception) onto the queue.
    """
    try:
        result = get_debug_log(code, input_data)
        queue.put(result)
    except Exception as e:
        queue.put(e)


def get_debug_log_limited(code: str, input_data: str):
    """
    Executes `code` under time (5 s) and memory-delta (256 MB) caps,
    returning (result, elapsed_sec, peak_delta_mb).
    """
    manager = multiprocessing.Manager()
    return_q = manager.Queue()
    stop_event = multiprocessing.Event()
    peak_mem = multiprocessing.Value('d', 0.0)

    time_limit_sec = 5
    memory_limit_mb = 1500

    # Start the worker
    worker = multiprocessing.Process(
        target=get_process_return,
        args=(return_q, code, input_data),
    )
    worker.start()

    # Start monitoring its memory delta
    monitor = multiprocessing.Process(
        target=monitor_memory_usage,
        args=(worker.pid, memory_limit_mb, stop_event, peak_mem),
    )
    monitor.start()

    start = time.time()
    result = None

    try:
        worker.join(time_limit_sec)
        if worker.is_alive():
            worker.terminate()
            stop_event.set()
            raise TimeoutException("Execution exceeded time limit.")

        if not return_q.empty():
            out = return_q.get()
            if isinstance(out, Exception):
                raise out
            result = out

    except TimeoutException as te:
        print(te)
    except MemoryLimitException as me:
        print(me)
    except Exception as e:
        print(f"[Execution error] {e}")
    finally:
        stop_event.set()
        monitor.join(timeout=1)
        if worker.is_alive():
            worker.terminate()

    elapsed = time.time() - start
    peak_delta = peak_mem.value

    print(f"Time: {elapsed:.2f}s; Memory Δ: {peak_delta:.2f} MB")
    return result, round(elapsed, 2), round(peak_delta, 2)
