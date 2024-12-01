import ast

IMPORT_WHITE_LIST = ['__future__', 'abc', 'array', 'bisect', 'calendar', 'cmath',
                     'collections', 'copy', 'datetime', 'decimal', 'doctest', 'fractions',
                     'functools', 'hashlib', 'heapq', 'io', 'itertools', 'json',
                     'locale', 'math', 'operator', 'pickle', 'pprint', 'random',
                     're', 'string', 'types', 'typing', 'unittest']

FUNCTIONS_BLACK_LIST = ['exec', 'eval', 'compile', 'open', '__import__', 'getattr', 'setattr', 
                        'delattr', 'globals', 'locals']


def check_program_action(code) -> bool:
    """
    Check if the program uses any module or function not in the white list.
    """
    tree = ast.parse(code)
    for node in ast.walk(tree):
        # Check for forbidden imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name not in IMPORT_WHITE_LIST:
                    return 'Importing module "{}" not in white list'.format(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module not in IMPORT_WHITE_LIST:
                return 'Importing module "{}" not in white list'.format(node.module)
        
        # Check for forbidden function calls
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):  # Direct call to a function like exec()
                if node.func.id in FUNCTIONS_BLACK_LIST:
                    return 'Your code uses "{}", which is not allowed'.format(node.func.id)
            elif isinstance(node.func, ast.Attribute):  # Method call, e.g., obj.exec()
                if node.func.attr in FUNCTIONS_BLACK_LIST:
                    return 'Your code uses "{}", which is not allowed'.format(node.func.attr)

    return True
