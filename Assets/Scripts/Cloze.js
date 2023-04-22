[].forEach.call(document.querySelectorAll('.cloze'),
    function(V0) {
        let hint = V0.innerHTML.match(/\[(.+)\]/)[1];
        if (hint === "s") {
            V0.innerHTML = "&nbsp;&nbsp"
        } else if (hint === "...") {
            V0.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
        } else if (hint === "@auto_phrase") {
            V0.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;〔" + auto_phrase(V0.dataset.cloze) + "〕&nbsp;&nbsp;&nbsp;&nbsp;"
        } else {
            V0.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;〔" + hint + "〕&nbsp;&nbsp;&nbsp;&nbsp;"
        }
    });

function auto_phrase(phrase) {
    let neglectWords = ["sth.", "sb.", "sp.", "...", "?", "in", "of", "from", "at", "on", "through", "via", "before", "after", "until", "to", "down", "up", "off", "away", "into", "onto", "upon", "out", "with", "without", "within", "by", "for", "since", "toward", "towards", "forward", "forwards", "above", "below", "beyond", "again", "about", "under", "beneath", "during", "around", "than", "over", "beside", "behind", "as", "and", "or", "though", "but", "not", "nor", "either", "neither", "yet", "both", "so", "such", "that", "which", "when", "how", "what", "a", "an", "the", "this", "that", "if", "no", "most", "one", "one's", "oneself", "do", "does", "doing", "did", "done", "be", "is", "are", "was", "were", "been", "many", "much", "can", "can't", "sb.'s", "back", "there", "there's", "it", "it's", "other", "else", "among", "against", "things", "ever", "something", "everything", "anything", "i", "me", "my", "we", "us", "our", "you", "your", "he", "him", "his", "she", "her", "they", "them", "their", "whether", "whose", "very", "other", "others", "another", "upside", "should", "only", "ahead", "throughout", "b", "once", "all"]
    words = phrase.split(" ")
    for (order in words) {
        if (neglectWords.includes(words[order].toLowerCase()))
            continue
        return words[order]
    }
}
