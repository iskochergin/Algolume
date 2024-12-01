document.addEventListener("DOMContentLoaded", function() {
    var codeTextarea = document.getElementById('code');
    var codeMirrorInstance = CodeMirror.fromTextArea(codeTextarea, {
        lineNumbers: true,
        mode: "python",
        theme: "dracula",
        indentUnit: 4,
        autoCloseBrackets: true,
    });

    var modal = document.getElementById("customAlertModal");
    var closeBtn = document.getElementsByClassName("close-button")[0];
    
    function CustomAlert(message) {
        document.getElementById('alertMessage').textContent = message;
        modal.style.display = "block";
    }
    
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    document.getElementById('runButton').addEventListener('click', async function(event) {
        event.preventDefault();  // Prevent the default form submission if it's within a form
        const code = codeMirrorInstance.getValue();
        const maxCodeLines = 300;
        const codeLines = code.split('\n').length;
        if (codeLines > maxCodeLines) {
            CustomAlert('The code is too large! The maximum number of lines is 300.');
            return;
        }

        const input = document.getElementById('input') ? document.getElementById('input').value : '';
        
        try {
            const response = await fetch('http://127.0.0.1:5000/new-debug-page', {
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
            console.log(debugging_result)

            if (debugging_result.execution_time > 5) {
                CustomAlert(`Time limit exceeded. Execution time: ${debugging_result.execution_time} seconds.`);
            } else if (debugging_result.memory_used > 256) {
                CustomAlert(`Memory usage exceeded. Used: ${debugging_result.memory_used} MB.`);
            } else {
                window.location.href = debugging_result.url;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            CustomAlert('Error sending input to server.');
        }
    })  
});
