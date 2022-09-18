[].forEach.call(document.querySelectorAll('.cloze'),
    function(V0) {
        V0.innerHTML = V0.innerHTML.replace(/.+/g, "&nbsp;".repeat(8));
    });
