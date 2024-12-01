document.addEventListener("DOMContentLoaded", function() {
    var codeTextarea = document.getElementById('code');
    var codeMirrorInstance = CodeMirror.fromTextArea(codeTextarea, {
        lineNumbers: true,
        mode: "python",
        theme: "dracula",
        indentUnit: 4,
        autoCloseBrackets: true,
    }); 

    document.getElementById('runButton').addEventListener('click', async function(event) {
        event.preventDefault();  // Prevent the default form submission if it's within a form
        const code = codeMirrorInstance.getValue();
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const debugging_result = await response.json();
            // Redirect to the new page with the ID from the response
            window.location.href = debugging_result.url;
        } catch (error) {
            console.error('Fetch error:', error);
            document.getElementById('result').innerText = 'Error sending request.';
        }
    })  
});
