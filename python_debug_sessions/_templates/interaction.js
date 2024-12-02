let currentStep = 0; // Track the current step in the debugging process
let previousLineNumber = null; // Track the line number of the previous step
let codeMirrorInstance = null; //  Reference to the CodeMirror instance for code display
let userInputs = []; // Store the user input lines
let inputLineIndex = 0; // Track the current line of input being used
let usedInputLines = 0; // Track the number of input lines used so far
let userInputMirror = null; // Reference to the CodeMirror instance for user input
let inputNeeded = false; // Flag to indicate if input is needed at the current step
let nextButton = null; // Reference to the Next button
let prevButton = null; // Reference to the Previous button
let maxCurrentStep = 0; // Track the maximum step reached in the current session
let frozen = false // Indicates if the page is frozen

document.addEventListener("DOMContentLoaded", function() {
    initializeCodeMirror();
    displayStep(currentStep);

    nextButton = document.getElementById('next-button');
    prevButton = document.getElementById('prev-button');
});

function initializeCodeMirror() {
    let codeContent = codeLines.join('\n');
    document.getElementById('code-textarea').value = codeContent;

    // Initialize code display
    var codeTextarea = document.getElementById('code-textarea');
    codeMirrorInstance = CodeMirror.fromTextArea(codeTextarea, {
        lineNumbers: true,
        mode: "python",
        theme: "dracula",
        indentUnit: 4,
        autoCloseBrackets: true,
        readOnly: true
    });

    // Initialize user input area
    var userInput = document.getElementById('user-input');
    userInputMirror = CodeMirror.fromTextArea(userInput, {
        lineNumbers: false,
        mode: "text/plain",
        theme: "dracula",
        indentUnit: 4,
        lineWrapping: true,
        readOnly: false,
        cursorHeight: 1,
    });

    // Add a specific class to this CodeMirror instance
    userInputMirror.getWrapperElement().classList.add('input-codemirror');
    userInputMirror.setValue(userInputs.join('\n'));

    // Handle read-only lines
    userInputMirror.on('beforeChange', function(cm, change) {
        const lastEditableLine = userInputs.length; // Lines after this are editable

        if (change.from.line < lastEditableLine) {
            change.cancel();
        }
    });

    userInputMirror.on("change", function(cm) {
        const totalLines = cm.lineCount();
        for (let i = 0; i < totalLines; i++) {
            cm.setGutterMarker(i, "CodeMirror-linenumbers", makeMarker());
        }
    });

    userInputMirror.on('keydown', handleUserInputKeydown);
    userInputMirror.on("paste", handleUserInputPaste);    
}

function displayStep(step) {
    // Unhighlight the previous line
    if (previousLineNumber !== null) {
        unhighlightLine(previousLineNumber);
    }

    const currentLog = debugLog[currentStep];
    const lineNumber = currentLog ? currentLog.line_number : null;

    if (lineNumber !== null) {
        highlightLine(lineNumber);
        previousLineNumber = lineNumber;
    }

    renderExecutionTrace();

    // Check if the current step requires input
    if (currentLog && (currentLog.stdin === '' || currentLog.stdin === needInput)) {
        inputNeeded = true;
        // nextButton.disabled = true;
    } else {
        inputNeeded = false;
        // nextButton.disabled = false;
    }
}

function handleUserInputPaste(cm, e) {
    e.preventDefault();
    
    // Get text from clipboard
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('Text');

    const pastedLines = pastedData.split('\n');
    if (pastedData[-1] != '\n') {
        pastedLines.pop();
    }

    // Insert the pasted text at the current cursor position
    const cursor = cm.getCursor();
    cm.replaceRange(pastedData, cursor);

    pastedLines.forEach(line => {
        if (line !== '\r' && line !== '') {
            userInputs.push(line.replace(/\r$/, ''));
            inputLineIndex += 1;
        }
    });

    // Log the updated array or handle it as needed
    console.log("Updated userInputs after paste:", userInputs);
    console.log("Current userInputMirror value", userInputMirror.getValue());
    console.log("Current input line index", inputLineIndex);
}

function handleUserInputKeydown(cm, e) {
    if (e.key === 'Enter') {
        // Use setTimeout to ensure we process after the new line is added
        setTimeout(function() {
            const doc = cm.getDoc();
            const cursor = doc.getCursor(); // Cursor after Enter key
            const lines = doc.getValue().split('\n');

            // Get the previous line (before the cursor moved down)
            const prevLineNumber = cursor.line - 1;
            const prevLineContent = lines[prevLineNumber];

            if (prevLineContent !== '') {
                // Update userInputs with the previous line
                userInputs.push(prevLineContent);
                inputLineIndex += 1;
                console.log('Updated userInputs:', userInputs);
                console.log("Current userInputMirror value", userInputMirror.getValue());
                console.log("Current input line index", inputLineIndex);
            } else {
                console.error('No content to process.');
            }
        }, 0); // Delay execution until after the default action
    }
}

function makeMarker() {
    var marker = document.createElement("div");
    marker.style.color = "#37bb4f";
    marker.innerHTML = ">>> ";
    return marker;
}

function processNextInputLine() {
    inputNeeded = false;
    nextButton.disabled = false;

    // Send input to the server and update debugLog
    sendInputAndGetNewTrace();
}

async function sendInputAndGetNewTrace() {
    try {
        const code = codeLines.join('\n');
        usedInputLines += 1;
        const input = userInputs.slice(0, usedInputLines).join('\n') + '\n' + needInput;
        // console.log(input);

        const response = await fetch('http://127.0.0.1:5000/request-debug-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, input })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const debugging_result = await response.json();
        // Redirect to the new page with the ID from the response
        console.log(debugging_result);

        if (debugging_result.execution_time > 5 || debugging_result.memory_used > 256) {
            document.querySelectorAll("input, button").forEach(elem => elem.disabled = true);
            frozen = true;
            CustomAlert(`Memory/Time limit exceeded. Time: ${debugging_result.execution_time} seconds. Memory: ${debugging_result.memory_used} MB. All actions on the page are frozen, reload it to run the code again!`);
        } else {
            debugLog = debugging_result['log'];
            stepForward();
        }
    } catch (error) {
        console.error('Fetch error:', error);
        CustomAlert('Error sending input to server.');
    }
}

// function renderVariables(variables) {
//     let html = '<div class="variables-container">';
//     for (const scopeName in variables) {
//         const scopeVars = variables[scopeName];

//         html += `<div class="variable-scope">`;
//         html += `<h3>${scopeName}</h3>`;
//         html += `<table class="variables-table">`;
//         html += `<thead><tr><th>Name</th><th>Value</th></tr></thead>`;
//         html += `<tbody>`;
//         for (const varName in scopeVars) {
//             const varValue = scopeVars[varName];
//             html += `<tr><td class="variable-name">${varName}</td><td class="variable-value">${formatVariableValue(varValue)}</td></tr>`;
//         }
//         html += `</tbody>`;
//         html += `</table>`;
//         html += `</div>`;
//     }
//     html += '</div>';
//     return html;
// }

// function formatVariableValue(value) {
//     if (Array.isArray(value)) {
//         return '[' + value.map(formatVariableValue).join(', ') + ']';
//     } else if (typeof value === 'object' && value !== null) {
//         let entries = [];
//         for (const key in value) {
//             entries.push(`${key}: ${formatVariableValue(value[key])}`);
//         }
//         return '{' + entries.join(', ') + '}';
//     } else if (typeof value === 'string') {
//         return `"${value}"`;
//     } else {
//         return String(value);
//     }
// }

function appendToUserInput(contentToAdd) {
    const lastLine = userInputMirror.lastLine();
    userInputMirror.replaceRange(contentToAdd + '\n', { line: lastLine + 1, ch: 0 });
    userInputMirror.scrollTo(null, userInputMirror.getScrollInfo().height);
    userInputs.length += 1 + contentToAdd.indexOf('\n');
}

function renderExecutionTrace() {
    const executionOutput = document.getElementById('execution-output');
    const currentLog = debugLog[currentStep];

    executionOutput.textContent = JSON.stringify(currentLog, null, 2);
    // executionOutput.innerHTML = renderVariables(currentLog);

    // Append stdout to the user input area
    if (currentLog.stdout) {
        appendToUserInput(currentLog.stdout);
    }
}

function highlightLine(lineNumber) {
    codeMirrorInstance.addLineClass(lineNumber - 1, 'background', 'highlight');
}

function unhighlightLine(lineNumber) {
    codeMirrorInstance.removeLineClass(lineNumber - 1, 'background', 'highlight');
}

var modal = document.getElementById("customAlertModal");
var closeBtn = document.getElementsByClassName("close-button")[0];

function CustomAlert(message) {
    document.getElementById('alertMessage').textContent = message;
    modal.style.display = "block";
}

closeBtn.onclick = function() {
    if (!frozen) {
        modal.style.display = "none";
    }
}
window.onclick = function(event) {
    if (event.target == modal && !frozen) {
        modal.style.display = "none";
    }
}

function stepForward() {
    if (inputNeeded) {
        if (usedInputLines == inputLineIndex) {
            CustomAlert('Please provide the required input before proceeding 😸');
        } else {
            processNextInputLine();
        }
        return;
    }

    if (currentStep == debugLog.length - 1 || debugLog[currentStep + 1].line_content == null) {
        CustomAlert('End of the debugging session 😽');
    } else if (currentStep < debugLog.length - 1) {
        currentStep++;
        maxCurrentStep = Math.max(maxCurrentStep, currentStep);
        displayStep(currentStep);
    }
}

function stepBack() {
    if (currentStep > 0) {
        currentStep--;
        displayStep(currentStep);
    }
}

function stepFirst() {
    currentStep = 0;
    displayStep(currentStep);
}

function stepLast() {
    currentStep = maxCurrentStep;
    displayStep(currentStep);
}
