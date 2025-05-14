import subprocess
import pprint


def debug_cpp_with_gdb(executable_path):
    # Start GDB with the given executable
    gdb_process = subprocess.Popen(['gdb', executable_path],
                                   stdin=subprocess.PIPE,
                                   stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE,
                                   text=True,
                                   bufsize=1)  # Line-buffered

    # Function to send a command to GDB
    def send_command(command):
        gdb_process.stdin.write(command + '\n')
        gdb_process.stdin.flush()

    # Initialize GDB, set a breakpoint at main, and start the program
    send_command('set pagination off')  # Disable pagination
    send_command('break main')
    send_command('run')
    send_command('next')  # Move to the first line in main

    # Capture and store the trace results
    trace_results = []
    while True:
        send_command('info locals')  # Print all local variables
        locals_output = gdb_process.stdout.readline()  # Read the variable output
        send_command('where')  # Get current line info
        line_info = gdb_process.stdout.readline()  # Read the line info

        # Store the results
        trace_results.append({
            'locals': locals_output.strip(),
            'line_info': line_info.strip()
        })

        # Step to the next line
        send_command('next')

        # Check if the program has ended
        output = gdb_process.stdout.readline()
        if 'exited' in output or 'End of program' in output:
            break

    # Terminate GDB
    send_command('quit')
    gdb_process.terminate()

    return trace_results


# Example usage
executable_path = 'script.exe'
trace_output = debug_cpp_with_gdb(executable_path)
pprint.pprint(trace_output)
