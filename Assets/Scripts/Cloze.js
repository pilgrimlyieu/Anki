[].forEach.call(document.querySelectorAll('.cloze'),
    function(V0) {
        let hint = V0.innerHTML.match(/\[(.+)\]/)[1];
        V0.innerHTML = (hint === "s") ? "&nbsp;&nbsp" : (hint === "...") ? "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" : "&nbsp;&nbsp;&nbsp;&nbsp;(" + hint + ")&nbsp;&nbsp;&nbsp;&nbsp;"
    });
