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
    Monitors the memory usage of the process with the given PID.
    Updates the peak_memory value with the highest memory usage observed.
    Terminates the process if memory usage exceeds the specified limit.
    """
    try:
        process = psutil.Process(pid)
        while not stop_event.is_set():
            try:
                mem_usage = process.memory_info().rss / (1024 * 1024)  # Convert to MB
                with peak_memory.get_lock():
                    if mem_usage > peak_memory.value:
                        peak_memory.value = mem_usage
                if mem_usage > max_mem_mb:
                    process.terminate()  # Cross-platform termination
                    stop_event.set()
                    raise MemoryLimitException(f"Memory usage exceeded the limit of {max_mem_mb} MB.")
                time.sleep(0.1)  # Adjust the monitoring frequency as needed
            except psutil.NoSuchProcess:
                break  # Process has terminated
    except Exception as e:
        print(f"Memory monitor encountered an error: {e}")

def get_process_return(queue, code, input_data):
    """
    Executes the target function and puts the result into the queue.
    """
    try:
        result = get_debug_log(code, input_data)
        queue.put(result)
    except Exception as e:
        queue.put(e)

def get_debug_log_limited(code: str, input_data: str):
    """
    Executes the given code with input_data under time and memory constraints.
    Returns a tuple of (function_return, execution_time, peak_memory).
    """
    # Manager for shared objects
    manager = multiprocessing.Manager()
    return_queue = manager.Queue()
    stop_event = multiprocessing.Event()
    peak_memory = multiprocessing.Value('d', 0.0)  # Shared value to track peak memory

    # Define limits
    time_limit_sec = 5
    memory_limit_mb = 256

    # Create the child process
    process = multiprocessing.Process(target=get_process_return, args=(return_queue, code, input_data))
    process.start()

    # Start memory monitoring in a separate process
    monitor_process = multiprocessing.Process(
        target=monitor_memory_usage,
        args=(process.pid, memory_limit_mb, stop_event, peak_memory),
    )
    monitor_process.start()

    # Record the start time
    start_time = time.time()

    try:
        # Wait for the process to complete within the time limit
        process.join(time_limit_sec)
        if process.is_alive():
            process.terminate()  # Cross-platform termination
            stop_event.set()
            raise TimeoutException("Function execution exceeded the time limit.")

        # Retrieve the return value
        if not return_queue.empty():
            func_return = return_queue.get()
            if isinstance(func_return, Exception):
                raise func_return
        else:
            func_return = None  # No return value was put in the queue

    except TimeoutException as te:
        print(te)
        func_return = None
    except MemoryLimitException as mle:
        print(mle)
        func_return = None
    except Exception as e:
        print(f"An error occurred: {e}")
        func_return = None
    finally:
        # Ensure all processes are cleaned up
        stop_event.set()
        monitor_process.join(timeout=1)
        if process.is_alive():
            process.terminate()

    # Record the end time
    end_time = time.time()
    execution_time = end_time - start_time
    peak_mem = peak_memory.value

    # Print execution details
    print(f"Execution Time: {execution_time:.2f} seconds")
    print(f"Peak Memory Usage: {peak_mem:.2f} MB")

    return func_return, round(execution_time, 2), round(peak_mem, 2)
