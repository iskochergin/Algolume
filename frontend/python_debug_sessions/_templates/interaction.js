let currentStep = 0; // Track the current step in the debugging process
let previousLineNumber = null; // Track the line number of the previous step
let codeMirrorInstance = null; // Reference to the CodeMirror instance for code display
let userInputs = []; // Store the user input lines (used during typing)
let inputLineIndex = 0; // Track the current line of input being used
let usedInputLines = 0; // Track the number of input lines used so far
let userInputMirror = null; // Reference to the CodeMirror instance for user input
let inputNeeded = false; // Flag to indicate if input is needed at the current step
let nextButton = null; // Reference to the Next button
let prevButton = null; // Reference to the Previous button
let maxCurrentStep = 0; // Track the maximum step reached in the current session
let frozen = false; // Indicates if the page is frozen
let usedMax = false; // Indicates if the max step has been used
let waitingServer = false; // Indicates if the server is waiting for input

let stepsContent = [];
stepsContent[0] = "";

function updateSliderMax() {
    const stepSlider = document.getElementById('step-slider');
    stepSlider.max = debugLog.length - 1;
    document.getElementById('total-steps').textContent = debugLog.length - 2;
}

function moveSliderTo(newValue) {
    const stepSlider = document.getElementById('step-slider');
    stepSlider.value = newValue;
    if (currentStep < maxCurrentStep) {
        reinitUserInputBack();
    } else {
        reinitUserInputFront();
    }
    displayStep(currentStep);
    document.getElementById('current-step').textContent = newValue;
}

document.addEventListener("DOMContentLoaded", function() {
    initializeCodeMirror();
    displayStep(currentStep);
  
    nextButton = document.getElementById('next-button');
    prevButton = document.getElementById('prev-button');
  
    updateSliderMax();
    
    let sliderLocked = false;
    const stepSlider = document.getElementById('step-slider');
    stepSlider.addEventListener('input', function() {
        if (sliderLocked) return;

        const currentLog = debugLog[currentStep];
    
        if (!(currentLog.stdin === needInput || currentLog.stdin === '')) {
            let newCurrentStep = parseInt(this.value);
            const currentStepCopy = currentStep;
            
            if (maxCurrentStep < newCurrentStep) {
                for (let i = currentStepCopy + 1; i <= newCurrentStep; i++) {
                    // console.log(i, usedInputLines);
                    if (inputNeeded) {
                        moveSliderTo(i);
                        break;
                    }
                    stepForward();
                }    
            } else {
                currentStep = newCurrentStep;
                reinitUserInputBack();
                displayStep(currentStep);        
            }

            if (newCurrentStep == debugLog.length) {
                currentStep = debugLog.length - 1;
            }
            maxCurrentStep = Math.max(currentStep, maxCurrentStep);

            if (currentStep < maxCurrentStep) {
                reinitUserInputBack();
            } else {
                reinitUserInputFront();
            }
            displayStep(currentStep);

            
            document.getElementById('current-step').textContent = currentStep;
        } else {
            moveSliderTo(currentStep);

            sliderLocked = true;
            stepSlider.disabled = true;
  
            stepForward();

            sliderLocked = false;
            stepSlider.disabled = false;
        }
    });
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

    initializeUserInput();
}

function initializeUserInput() {
    // Initialize user input area (editable)
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
    // Set its content from the stored snapshot for this step, if any
    if (stepsContent[currentStep]) {
        userInputMirror.setValue(stepsContent[currentStep]);
    }

    userInputMirror.execCommand("goDocEnd");

    // Handle read-only lines
    userInputMirror.on('beforeChange', function(cm, change) {
        const lastEditableLine = stepsContent[currentStep].split('\n').length - 1; // Lines after this are editable

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

function initializeUserInputReadonly() {
    // Initialize user input area (read-only version)
    var userInput = document.getElementById('user-input');
    userInputMirror = CodeMirror.fromTextArea(userInput, {
        lineNumbers: false,
        mode: "text/plain",
        theme: "dracula",
        indentUnit: 4,
        lineWrapping: true,
        readOnly: true,
        cursorHeight: 1,
    });

    // Add a specific class to this CodeMirror instance
    userInputMirror.getWrapperElement().classList.add('input-codemirror');
    // Set its content from the stored snapshot for this step.
    if (stepsContent[currentStep]) {
        userInputMirror.setValue(stepsContent[currentStep]);
    }

    userInputMirror.execCommand("goDocEnd");

    userInputMirror.on("change", function(cm) {
        const totalLines = cm.lineCount();
        for (let i = 0; i < totalLines; i++) {
            cm.setGutterMarker(i, "CodeMirror-linenumbers", makeMarker());
        }
    });

    userInputMirror.on('keydown', handleUserInputKeydown);
    userInputMirror.on("paste", handleUserInputPaste);    
}

// Helper function to escape HTML entities
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function renderDebugVisualization(debugData) {
    let html = '';

    // Display error only if it exists and doesn't contain needInput.
    // console.log(debugData.error);
    if (debugData.error && !inputNeeded && !debugData.error.includes(needInput) && !debugData.error.includes("''") && !debugData.error.includes('WOIEJ:BWOIE')) {
        // renderedError = debugData.error.replace('WOIEJ:BWOIE', '');
        html += `<div class="debug-error">${escapeHtml(debugData.error)}</div>`;
    }

    html += `<div class="variable-scope">
                <h4>Line ${debugData.line_number || '-'}</h4>`;

    if (debugData.line_content) {
        html += `<pre style="background-color:#0d1117; padding:8px; border-radius:4px;">
                    ${escapeHtml(debugData.line_content)}
                 </pre>`;
    }

    // Render Globals table.
    if (debugData.variables && debugData.variables.globals) {
        html += renderVariablesTable("Globals", debugData.variables.globals);
    }

    // For each function in globals, if detailed info is available, render it in its own block.
    if (debugData.variables && debugData.variables.globals) {
        for (let key in debugData.variables.globals) {
            let val = debugData.variables.globals[key];
            if (typeof val === "string" && val.startsWith("<function")) {
                if (debugData.variables[key] && typeof debugData.variables[key] === "object") {
                    html += renderVariablesTable(`Local (${key})`, debugData.variables[key]);
                }
            }
        }
    }

    // Render other local sections.
    if (debugData.variables) {
        for (let key in debugData.variables) {
            if (key === "globals") continue;
            if (
                debugData.variables.globals &&
                debugData.variables.globals[key] &&
                typeof debugData.variables.globals[key] === "string" &&
                debugData.variables.globals[key].startsWith("<function")
            ) {
                continue;
            }
            html += renderVariablesTable(`Local (${key})`, debugData.variables[key]);
        }
    }

    // Optionally show call stack depth.
    if (typeof debugData.call_stack_depth !== 'undefined') {
        html += `<div style="margin-top:10px;"><strong>Call Stack Depth:</strong> ${debugData.call_stack_depth}</div>`;
    }

    html += `</div>`;

    document.getElementById('variable-visualization').innerHTML = html;
    document.getElementById('current-step').textContent = currentStep;
    document.getElementById('total-steps').textContent = debugLog.length - 2;
}

/**
 * Renders a variables table for a given section.
 * If a value is a function string (starting with "<function"),
 * it is rendered by outputting its value directly (HTML-escaped),
 * preserving the complete name.
 *
 * @param {string} title - The title of the section.
 * @param {object} obj - The object holding the variables.
 * @returns {string} - The HTML for that section.
 */
function renderVariablesTable(title, obj) {
    let html = `<h4>${title}</h4>
                <table class="variables-table">
                    <thead>
                        <tr><th>Variable</th><th>Value</th></tr>
                    </thead>
                    <tbody>`;

    for (let key in obj) {
        let val = obj[key];
        if (typeof val === "string" && val.startsWith("<function")) {
            html += `<tr>
                        <td class="variable-name">${escapeHtml(key)}</td>
                        <td class="variable-value">${escapeHtml(val)}</td>
                     </tr>`;
        } else {
            html += `<tr>
                        <td class="variable-name">${escapeHtml(key)}</td>
                        <td class="variable-value">${JSON.stringify(val, null, 2)}</td>
                     </tr>`;
        }
    }

    html += `</tbody></table>`;
    return html;
}
  
  

function displayStep(step) {
    const stepSlider = document.getElementById('step-slider');
    if (stepSlider) {
        stepSlider.value = step;
    }
    document.getElementById('current-step').textContent = step;
    
    renderDebugVisualization(debugLog[currentStep]);
    
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
    } else {
        inputNeeded = false;
    }
}

function handleUserInputPaste(cm, e) {
    if (currentStep < maxCurrentStep) {
        CustomAlert('You can enter input only in the last viewed step!')
        return;
    }
 
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

    // console.log("Updated userInputs after paste:", userInputs);
    // console.log("Current userInputMirror value", userInputMirror.getValue());
    // console.log("Current input line index", inputLineIndex);
    // Update stored content for this step
    stepsContent[currentStep] = userInputMirror.getValue();

    // console.log(stepsContent);
}

function handleUserInputKeydown(cm, e) {
    if (currentStep < maxCurrentStep) {
        CustomAlert('You can enter input only in the last step!')
        return;
    }

    if (e.key === 'Enter') {
        // Use setTimeout to ensure we process after the new line is added
        setTimeout(function() {
            const doc = cm.getDoc();
            const cursor = doc.getCursor(); // Cursor after Enter key
            const lines = doc.getValue().split('\n');

            // Get the previous line (before the cursor moved down)
            const prevLineNumber = cursor.line - 1;
            const prevLineContent = lines[prevLineNumber];
            
            // IF DON'T NEED TO PROCESS EMPTY LINES
            if (prevLineContent !== '') {
                // Update userInputs with the previous line
                userInputs.push(prevLineContent);
                inputLineIndex += 1;
                stepsContent[currentStep] = userInputMirror.getValue();
            } else {
                console.error('No content to process.');
            }
            // userInputs.push(prevLineContent);
            // inputLineIndex += 1;
            // stepsContent[currentStep] = userInputMirror.getValue();

            // console.log(stepsContent);
        }, 0); // Delay execution until after the default action
    }
}

function makeMarker() {
    var marker = document.createElement("div");
    marker.style.color = "#37bb4f";
    marker.innerHTML = "";
    return marker;
}

function processNextInputLine() {
    inputNeeded = false;
    if (!nextButton) {
        nextButton = document.getElementById('next-button');
    }
    nextButton.disabled = false;
    sendInputAndGetNewTrace();
}

async function sendInputAndGetNewTrace() {
    try {
        waitingServer = true;
        const code = codeLines.join('\n');
        usedInputLines += 1;
        console.log('usedInputLines', usedInputLines);
        const input = userInputs.slice(0, usedInputLines).join('\n') + '\n' + needInput;

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
        // console.log(debugging_result);

        waitingServer = false;
        if (debugging_result.execution_time > 5 || debugging_result.memory_used > 256) {
            document.querySelectorAll("input, button").forEach(elem => elem.disabled = true);
            frozen = true;
            CustomAlert(`Memory/Time limit exceeded. Time: ${debugging_result.execution_time} seconds. Memory: ${debugging_result.memory_used} MB. All actions on the page are frozen, reload it to run the code again!`);
        } else {
            debugLog = debugging_result['log'];
            updateSliderMax();
            stepForward();
        }
    } catch (error) {
        console.error('Fetch error:', error);
        CustomAlert('Error sending input to server.');
    }
}

function renderExecutionTrace() {
    const executionOutput = document.getElementById('execution-output');
    const currentLog = debugLog[currentStep];

    executionOutput.textContent = JSON.stringify(currentLog, null, 2);

    // console.log("LOOOOOOOOOOOOOK", currentLog, currentStep, maxCurrentStep, usedMax);
    if (currentLog.stdout && currentStep == maxCurrentStep && !usedMax) {
        // console.log('AAAAAAAA', currentLog.stdout, currentStep);
        stepsContent[currentStep] += currentLog.stdout + '\n';
        usedMax = true;
        reinitUserInputFront();
    }
}

function highlightLine(lineNumber) {
    codeMirrorInstance.addLineClass(lineNumber - 1, 'background', 'highlight');

        // Scroll so that the highlighted line is visible near the top
        codeMirrorInstance.scrollIntoView({ line: lineNumber - 1, ch: 0 }, 100);
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

function reinitUserInputBack() {
    const codeMirrorElement = document.querySelector('.CodeMirror.cm-s-dracula.CodeMirror-wrap.input-codemirror');

    if (codeMirrorElement) {
        userInputMirror.toTextArea();
        userInputMirror.setValue("");
        userInputMirror = null;
    }
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.value = "";
    }

    initializeUserInputReadonly();
}

function reinitUserInputFront() {
    const codeMirrorElement = document.querySelector('.CodeMirror.cm-s-dracula.CodeMirror-wrap.input-codemirror');

    if (codeMirrorElement) {
        userInputMirror.toTextArea();
        userInputMirror.setValue("");
        userInputMirror = null;
    }
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.value = "";
    }

    initializeUserInput();
}

function stepForward() {
    if (waitingServer) {
        return;
    }
    // console.log('!!!!!!!INPUT', userInputs);
    // console.log(inputLineIndex);
    // console.log("Current userInputMirror value", userInputMirror.getValue());
    const currentLog = debugLog[currentStep];
    // console.log('stdin', currentLog.stdin);

    if (currentLog.stdin === needInput || currentLog.stdin === '') {
        inputNeeded = true;
    }

    // console.log(inputNeeded)
    // console.log('!!!!', usedInputLines, inputLineIndex);

    if (inputNeeded) {
        if (usedInputLines == inputLineIndex) {
            CustomAlert('Please provide the required input before proceeding 😸');
            return;
        } else {
            processNextInputLine();
        }
        return;
    }

    if (currentStep == debugLog.length - 1 || debugLog[currentStep + 1].line_content == null) {
        // CustomAlert('End of the debugging session 😽');
    } else if (currentStep < debugLog.length - 1) {
        // Before moving forward, the current step's snapshot is already updated via our event handlers.
        currentStep++;
        if (maxCurrentStep < currentStep) {
            maxCurrentStep = currentStep;
            usedMax = false;
            stepsContent[currentStep] = stepsContent[currentStep - 1];
            // console.log(stepsContent);
        }

        if (currentStep != maxCurrentStep) {
            reinitUserInputBack();
        } else {
            reinitUserInputFront();
        }
        displayStep(currentStep);
    }
}

function stepBack() {
    if (waitingServer) {
        return;
    }
    // console.log(currentStep)
    // console.log(stepsContent);

    if (currentStep > 0) {
        currentStep--;
        reinitUserInputBack();
        displayStep(currentStep);
    }
}

function stepFirst() {
    if (waitingServer) {
        return;
    }
    currentStep = 0;
    reinitUserInputBack();
    displayStep(currentStep);
}

function stepLast() {
    if (waitingServer) {
        return;
    }
    currentStep = maxCurrentStep;
    reinitUserInputFront()
    displayStep(currentStep);
}

function searchVariableRecursively(obj, varName) {
    if (obj === null || typeof obj !== 'object') return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, varName)) return obj[varName];
    for (let key in obj) {
        if (typeof obj[key] === 'object') {
            let found = searchVariableRecursively(obj[key], varName);
            if (found !== undefined) return found;
        }
    }
    return undefined;
}
