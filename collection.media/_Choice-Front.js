var showQuestionType = '1'
var hideOptions = '0'
var randomOptions = '1'
var delayOptions = '0'
var normalOption = '0'
var hideNotes = '0'
var autoFlip = '0'

function showFrontOptions(hideOption, randomOption, delayOption) {
    var keySeq = []
    var optionObjs = getOptionObjs(randomOption)
    initEmptyOptionList(optionObjs)
    var liList = ''
    for (var i in optionObjs) {
        var _optionObj = optionObjs[i]
        var _option = _optionObj.label
        if (hideOption === '1') {
            var endIndex = _optionObj.label.indexOf("《") > -1 ? 2 : 1
            _option = _optionObj.label.substring(0, endIndex)
        }
        liList += "<li id='" + _optionObj.key + "' class='option' onclick='markSelected(this)'>" + _option + "</li>"
        keySeq.push(_optionObj.key)
    }
    if (Persistence.isAvailable()) {
        Persistence.setItem('ANKI-OPTIONS-ORDER', keySeq.toString())
    }
    if (delayOption === '1') {
        setTimeout(function() {
            document.getElementById("front-options").innerHTML = liList
        }, 1500)
    } else {
        document.getElementById("front-options").innerHTML = liList
    }
}

function initEmptyOptionList(optionObjs) {
    var liList = ''
    for (var i in optionObjs) {
        liList += "<li class='option'></li>"
    }
    document.getElementById("front-options").innerHTML = liList
}

function getOptionObjs(randomOption) {
    var optionArray = OPTION.trim().split("||")
    var optionObjs = []
    for (var i in optionArray) {
        optionObjs.push({
            key: Number.parseInt(i) + 1,
            label: optionArray[i]
        })
    }
    if (randomOption === '1') {
        for (let i = 1; i < optionObjs.length; i++) {
            const random = Math.floor(Math.random() * (i + 1))
            const temp = optionObjs[i]
            optionObjs[i] = optionObjs[random]
            optionObjs[random] = temp
        }
    }
    return optionObjs
}

function getSelectedKey() {
    return normalOption === '1' ? 'selected' : 'selected-light'
}

function markSelected(li) {
    var selectedKey = getSelectedKey()
    // 对应多选
    if (ANSWER.indexOf('||') > 0) {
        if (Persistence.isAvailable()) {
            var selectedArray = Persistence.getItem('ANKI-SELECTED') ? Persistence.getItem('ANKI-SELECTED').split(',') : []
            if (li.className.indexOf(selectedKey) > 0) {
                selectedArray.splice(selectedArray.indexOf(li.id), 1)
            } else {
                selectedArray.push(li.id)
            }
            selectedArray.sort()
            Persistence.setItem('ANKI-SELECTED', selectedArray.toString())
            if (selectedArray.length === ANSWER.trim().split('||').length && autoFlip === '1') {
                setTimeout(function() {
                    flipToBack()
                }, 100)
            }
        }
        if (li.className.indexOf(selectedKey) > 0) {
            li.className = "option"
        } else {
            li.className = "option " + selectedKey
        }
    } else {
        // 单选
        for (var option of document.getElementsByClassName('option')) {
            option.className = 'option'
        }
        li.className = "option " + selectedKey
        if (Persistence.isAvailable()) {
            Persistence.setItem('ANKI-SELECTED', li.id)
        }
        if (autoFlip === '1') {
            setTimeout(function() {
                flipToBack()
            }, 100)
        }
    }
}

function flipToBack() {
    if (typeof pycmd !== "undefined") {
        pycmd("ans")
    } else if (typeof study !== "undefined") {
        study.drawAnswer()
    } else if (typeof AnkiDroidJS !== "undefined") {
        showAnswer()
    } else if (window.anki && window.sendMessage2) {
        window.sendMessage2("ankitap", "midCenter")
    }
}

function showTags() {
    var tags = TAGS
    if (!tags) return
    tags = tags.split(' ')
    var tagList = '<span class="tag-title">标签: </span>'
    for (var tag of tags) {
        if (tag) {
            tagList += '<span class="single-tag">' + tag + '</span>'
        }
    }
    document.getElementById("front-tag").innerHTML = tagList
}

function showSettings() {
    document.getElementById("settingsModal").style.display = 'block'
}

function hideSettings() {
    document.getElementById("settingsModal").style.display = 'none'
}

function renameIOsSendMessage() {
    if (window['sendMessage']) {
        window['sendMessage2'] = window['sendMessage']
        window['sendMessage'] = null
    }
}

function applySettings() {
    if (Persistence.isAvailable()) {
        showQuestionType = Persistence.getItem('ANKI-SETTINGS-SHOW-QUESTION-TYPE') || '1'
        hideOptions = Persistence.getItem('ANKI-SETTINGS-HIDE-OPTIONS') || '0'
        randomOptions = Persistence.getItem('ANKI-SETTINGS-RANDOM-OPTIONS') || '1'
        delayOptions = Persistence.getItem('ANKI-SETTINGS-DELAY-OPTIONS') || '0'
        normalOption = Persistence.getItem('ANKI-SETTINGS-NORMAL-OPTIONS') || '0'
        hideNotes = Persistence.getItem('ANKI-SETTINGS-HIDE-NOTES') || '0'
        autoFlip = Persistence.getItem('ANKI-SETTINGS-AUTO-FLIP') || '0'
        Persistence.setItem('ANKI-SELECTED', '')
    }
    document.getElementById('hide-option').checked = hideOptions === '1'
    document.getElementById('random-option').checked = randomOptions === '1'
    document.getElementById('show-type').checked = showQuestionType === '1'
    document.getElementById('delay-option').checked = delayOptions === '1'
    document.getElementById('normal-option').checked = normalOption === '1'
    document.getElementById('hide-notes').checked = hideNotes === '1'
    document.getElementById('auto-flip').checked = autoFlip === '1'
    showFrontOptions(hideOptions, randomOptions, delayOptions)
    dealQuestionType(showQuestionType)
}

function switchHideOption(input) {
    rerenderOptions(input, 'ANKI-SETTINGS-HIDE-OPTIONS')
}

function switchDelayOption(input) {
    rerenderOptions(input, 'ANKI-SETTINGS-DELAY-OPTIONS')
}

function switchRandomOption(input) {
    rerenderOptions(input, 'ANKI-SETTINGS-RANDOM-OPTIONS')
}

function switchNormalOption(input) {
    extractKeyFromInputAndSave(input, 'ANKI-SETTINGS-NORMAL-OPTIONS')
    var selectedKey = getSelectedKey()
    for (var option of document.getElementsByClassName('option')) {
        if (option.className.indexOf(' ') > -1) {
            option.className = "option " + selectedKey
        }
    }
}

function switchHideNotes(input) {
    extractKeyFromInputAndSave(input, 'ANKI-SETTINGS-HIDE-NOTES')
}

function switchShowType(input) {
    extractKeyFromInputAndSave(input, 'ANKI-SETTINGS-SHOW-QUESTION-TYPE')
    dealQuestionType(showQuestionType)
}

function switchAutoFlip(input) {
    extractKeyFromInputAndSave(input, 'ANKI-SETTINGS-AUTO-FLIP')
}

function extractKeyFromInputAndSave(input, persistKey) {
    var key = input.checked ? '1' : '0'
    if (Persistence.isAvailable()) {
        Persistence.setItem(persistKey, key)
        if (persistKey === 'ANKI-SETTINGS-RANDOM-OPTIONS' || persistKey === 'ANKI-SETTINGS-DELAY-OPTIONS' || persistKey === 'ANKI-SETTINGS-HIDE-OPTIONS') {
            Persistence.setItem('ANKI-SELECTED', '')
        }
    }
    if (persistKey === 'ANKI-SETTINGS-HIDE-OPTIONS') {
        hideOptions = key
    } else if (persistKey === 'ANKI-SETTINGS-DELAY-OPTIONS') {
        delayOptions = key
    } else if (persistKey === 'ANKI-SETTINGS-RANDOM-OPTIONS') {
        randomOptions = key
    } else if (persistKey === 'ANKI-SETTINGS-NORMAL-OPTIONS') {
        normalOption = key
    } else if (persistKey === 'ANKI-SETTINGS-SHOW-QUESTION-TYPE') {
        showQuestionType = key
    } else if (persistKey === 'ANKI-SETTINGS-HIDE-NOTES') {
        hideNotes = key
    } else if (persistKey === 'ANKI-SETTINGS-AUTO-FLIP') {
        autoFlip = key
    }
    return key
}

function rerenderOptions(input, persistKey) {
    extractKeyFromInputAndSave(input, persistKey)
    showFrontOptions(hideOptions, randomOptions, delayOptions, normalOption)
}

function dealQuestionType(showQuestionType) {
    if (showQuestionType === '1') {
        document.getElementById('questionType').innerHTML = ANSWER.indexOf('||') > -1 ? '（多选）' : '（单选）'
    } else {
        document.getElementById('questionType').innerHTML = ' '
    }
}

function addModelContent() {
    document.getElementById('settingsModal').innerHTML = '<div class="modal-content">\n' +
        '    <span class="close" onclick="hideSettings()">&times;</span>\n' +
        '    <div class="settings-block">\n' +
        '      <div class="single-setting">\n' +
        '        <div class="setting-label">显示类型</div>\n' +
        '        <div class="setting-switch">\n' +
        '          <input id="show-type" class="mui-switch mui-switch-anim" type="checkbox" onchange="switchShowType(this)">\n' +
        '        </div>\n' +
        '      </div>\n' +
        '      <div class="single-setting">\n' +
        '        <div class="setting-label">隐藏选项</div>\n' +
        '        <div class="setting-switch">\n' +
        '          <input id="hide-option" class="mui-switch mui-switch-anim" type="checkbox" onchange="switchHideOption(this)">\n' +
        '        </div>\n' +
        '      </div>\n' +
        '      <div class="single-setting">\n' +
        '        <div class="setting-label">随机选项</div>\n' +
        '        <div class="setting-switch">\n' +
        '          <input id="random-option" class="mui-switch mui-switch-anim" type="checkbox" onchange="switchRandomOption(this)">\n' +
        '        </div>\n' +
        '      </div>\n' +
        '      <div class="single-setting">\n' +
        '        <div class="setting-label">延迟选项</div>\n' +
        '        <div class="setting-switch">\n' +
        '          <input id="delay-option" class="mui-switch mui-switch-anim" type="checkbox" onchange="switchDelayOption(this)">\n' +
        '        </div>\n' +
        '      </div>\n' +
        '      <div class="single-setting">\n' +
        '        <div class="setting-label">纯色模式</div>\n' +
        '        <div class="setting-switch">\n' +
        '          <input id="normal-option" class="mui-switch mui-switch-anim" type="checkbox" onchange="switchNormalOption(this)">\n' +
        '        </div>\n' +
        '      </div>\n' +
        '      <div class="single-setting">\n' +
        '        <div class="setting-label">隐藏解析</div>\n' +
        '        <div class="setting-switch">\n' +
        '          <input id="hide-notes" class="mui-switch mui-switch-anim" type="checkbox" onchange="switchHideNotes(this)">\n' +
        '        </div>\n' +
        '      </div>\n' +
        '      <div class="single-setting">\n' +
        '        <div class="setting-label">自动翻转</div>\n' +
        '        <div class="setting-switch">\n' +
        '          <input id="auto-flip" class="mui-switch mui-switch-anim" type="checkbox" onchange="switchAutoFlip(this)">\n' +
        '        </div>\n' +
        '      </div>\n' +
        '    </div>\n' +
        '  </div>'
}

showTags()
renameIOsSendMessage()
addModelContent()
applySettings()
