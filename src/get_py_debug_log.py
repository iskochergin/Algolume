import sys
from pprint import pprint
import linecache
import builtins
import traceback
from copy import deepcopy
from typing import Any, Optional, Dict, List, Callable, Iterator, NoReturn
from types import FrameType
from check_program_action import check_program_action


execution_trace: List[Dict[str, Any]] = []
total_stdout: str = ""
prev_step_data: Optional[Dict[str, Any]] = None
input_gen: Iterator[str]


def tprint(*args: Any, **kwargs: Any) -> None:
    sys.stdout = original_stdout
    pprint(*args, **kwargs)
    sys.stdout = stdout_capture  # Redirect back to capture


def safe_deepcopy(value: Any) -> Any:
    try:
        return deepcopy(value)
    except Exception:
        return f"<unserializable: {type(value).__name__}>"


# Custom exception to handle sys.exit calls
class ExitCalled(Exception):
    def __init__(self, code: int = 0) -> None:
        self.code = code


def custom_exit(code: int = 0) -> NoReturn:
    raise ExitCalled(code)


def update_stdout() -> str:
    global total_stdout
    # Capture stdout generated since the last line
    stdout: str = stdout_capture.get_stdout()
    stdout_capture.clear()  # Clear stdout after capturing
    total_stdout += stdout
    if stdout != '':
        total_stdout += '\n'
    return stdout


def trace_lines(frame: FrameType, event: str, arg: Any) -> Optional[Callable]:
    global prev_step_data, total_stdout

    filename: str = frame.f_code.co_filename

    # Only process events from the target script
    if filename != "<string>":
        return trace_lines  # Continue tracing but do not process this frame

    if event == "line":
        stdout: str = update_stdout()

        # If there's a previous step, assign the captured stdout to it and append it to execution_trace
        if prev_step_data is not None:
            prev_step_data['stdout'] = stdout
            prev_step_data['total_stdout'] = total_stdout
            execution_trace.append(prev_step_data)

        # Now prepare the current step_data
        line_no: int = frame.f_lineno
        function_name: str = frame.f_code.co_name

        # Clear the linecache to ensure fresh line data is fetched
        linecache.checkcache(filename)

        # Initialize variables dictionary
        variables: Dict[str, Dict[str, Any]] = {}

        # Walk up the call stack frames and collect locals from the target script only
        current_frame: Optional[FrameType] = frame
        call_stack_depth: int = 0  # Initialize call stack depth

        # Traversing up the call stack to collect variables from all the active (upper) functions in the stack
        while current_frame is not None:
            func_name: str = current_frame.f_code.co_name
            func_filename: str = current_frame.f_code.co_filename

            # Only include frames from the target script
            if func_filename != "<string>":
                break  # Stop if the frame is not from the target script

            call_stack_depth += 1  # Increment call stack depth
            f_locals: Dict[str, Any] = current_frame.f_locals.copy()
            # Exclude built-ins and specific variables
            locals_dict: Dict[str, Any] = {}
            for key, value in f_locals.items():
                if key not in ["file_content", "file", "file_path", "input_file", "input_data",
                               "__builtins__", "__name__", "sys", "quit", "exit", "code"]:
                    locals_dict[key] = safe_deepcopy(value)
            if func_name == "<module>":
                variables["globals"] = locals_dict
            else:
                # Avoid overwriting variables from deeper frames
                if func_name not in variables:
                    variables[func_name] = locals_dict

            current_frame = current_frame.f_back

        # Adjust call_stack_depth since it includes the global frame
        call_stack_depth -= 1

        if "code" in frame.f_globals:
            line_content: str = frame.f_globals["code"].split("\n")[line_no - 1]
        else:
            line_content = "<line content unavailable>"

        prev_step_data = {
            "line_number": line_no,
            "function_name": function_name,
            "call_stack_depth": call_stack_depth,
            # "file_path": frame.f_globals.get("file_path", "<unknown>"),
            "stdout": "",  # Will be filled in the next 'line' event
            "total_stdout": total_stdout,
            "stdin": None,
            "variables": variables,
            "line_content": line_content,
        }

    return trace_lines  # Continue tracing


def input_handler(prompt: str = "") -> str:
    try:
        if prompt:
            value: str = prompt
        else:
            value = next(input_gen)
        if prev_step_data:
            prev_step_data["stdin"] = value  # Record the stdin in the current step
        return value
    except StopIteration:
        return ''  # Return empty string if stdin data is exhausted


def trace_program(code: str, input_data: str) -> List[Dict[str, Any]]:
    execution_trace.clear()
    global input_gen, stdout_capture, prev_step_data, total_stdout

    prev_step_data = None
    total_stdout = ""

    # Optionally if input is provided as a file
    # input_gen = input_generator(input_file)

    input_gen = input_generator_from_string(input_data)

    builtins.input = input_handler

    traced_globals: Dict[str, Any] = {
        "__name__": "__main__",
        "code": None,
        # "file_path": file_path,
        "sys": sys,
        "exit": custom_exit,
        "quit": custom_exit,
    }

    sys.settrace(trace_lines)
    traced_globals["code"] = code
    try:
        exec(code, traced_globals)
    except ExitCalled as e:
        # Handle sys.exit calls
        error_message: str = f"Program exited with exit code {e.code}"
        if prev_step_data is not None:
            prev_step_data['error'] = error_message
            prev_step_data['total_stdout'] = total_stdout
            execution_trace.append(prev_step_data)
            prev_step_data = None
    except Exception as e:
        stdout: str = update_stdout()

        error_message = f"Error during execution: {e}"
        traceback_lines = traceback.format_exc().split('\n')
        # Get the last two lines (exception line and message)
        exception_line = traceback_lines[-3].strip()
        exception_message = traceback_lines[-2].strip()
        traceback_str = exception_line + '\n' + exception_message

        if prev_step_data is not None:
            prev_step_data['stdout'] = stdout
            prev_step_data['total_stdout'] = total_stdout
            prev_step_data['error'] = error_message
            prev_step_data['traceback'] = traceback_str
            execution_trace.append(prev_step_data)
            prev_step_data = None
        else:
            # In case prev_step_data is None, create a new entry
            error_step = {
                "line_number": '?',
                "function_name": '?',
                "call_stack_depth": 0,
                # "file_path": file_path,
                "stdout": stdout,
                "total_stdout": total_stdout,
                "stdin": None,
                "variables": {},
                "line_content": "<error occurred before any lines executed>",
                "error": error_message,
                "traceback": traceback_str,
            }
            execution_trace.append(error_step)
    finally:
        sys.settrace(None)
        builtins.input = original_input  # Restore the original input
        sys.stdout = original_stdout  # Restore the original stdout

        stdout = update_stdout()

        if prev_step_data is not None:
            prev_step_data['stdout'] = stdout
            prev_step_data['total_stdout'] = total_stdout
            execution_trace.append(prev_step_data)
            prev_step_data = None

    return execution_trace


def input_generator_from_file(input_file: str) -> Iterator[str]:
    try:
        with open(input_file, "r") as file:
            for line in file:
                yield line.strip()
    except FileNotFoundError:
        print("Input file not found.")
        sys.exit(1)


def input_generator_from_string(input_data: str) -> Iterator[str]:
    try:
        for line in input_data.split("\n"):
            yield line.strip()
    except Exception:
        print("Error while reading input data.")
        sys.exit(1)


# Custom stdout capture class
class StdoutCapture:
    def __init__(self) -> None:
        self.stdout: str = ""

    def write(self, s: str) -> None:
        self.stdout += s

    def flush(self) -> None:
        pass

    def get_stdout(self) -> str:
        return self.stdout.strip()

    def clear(self) -> None:
        self.stdout = ""


def modify_unsupported_json_types(data):
    SUPPORTED_TYPES = [dict, list, tuple, str, int, float, True, False, None]
    for step in data:
        for location in step['variables']:
            for variable, contains in step['variables'][location].items():
                if type(contains) not in SUPPORTED_TYPES:
                    step['variables'][location][variable] = str(contains)
    return data


def get_debug_log(code: str, input_data: str) -> List[Dict[str, Any]]:
    try:
        global stdout_capture, original_stdout, original_input
        check_program_result = check_program_action(code)

        if check_program_result is not True:
            return check_program_result

        stdout_capture = StdoutCapture()
        original_stdout = sys.stdout
        sys.stdout = stdout_capture
        original_input = builtins.input

        trace_program(code, input_data)

        execution_trace.append({"line_number": "END",
                                "function_name": "<module>",
                                "call_stack_depth": 0,
                                "stdout": "hello world",
                                "total_stdout": execution_trace[-1]["total_stdout"],
                                "stdin": None,
                                "variables": {},
                                "line_content": None})

        # tprint(execution_trace)
        sys.stdout = original_stdout

        supported_json_execution_trace = modify_unsupported_json_types(execution_trace)

        return supported_json_execution_trace
    except Exception as e:
        print("ERROR WHILE GETTING DEBUGING LOG!", e)
        return "error", str(e).replace("<unknown>, ", "")
