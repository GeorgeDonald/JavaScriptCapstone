(function () {
    var game;
    var level = 0;
    var progress;
    var tries;

    var eleWelcomeStory;
    var eleRiddle;
    var eleMap;
    var eleAnswer;
    var eleTriesLeft;

    var curRiddle = null;
    var curAnswer = null;
    var nTimerID;

    function xmlToHtml(str) {
        return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    };

    function loadImage(url) {
        return new Promise(function (resolve, reject) {
            let img = new Image;
            let loaded = undefined;
            img.onload = function () { loaded = true; resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
            img.src = url;
        });
    }

    class cGame {
        constructor(game) {
            this.welcome = game.querySelector('welcome');
            this.map = game.querySelector('map');
            this.win = game.querySelector('win');
            this.winImg = this.win.querySelector('img').innerHTML;
            this.lose = game.querySelector('lose');
            this.loseImg = this.lose.querySelector('img').innerHTML;
            this.riddles = game.querySelector('riddles');

            this.welcomeImage = this.welcome.querySelector('img').innerHTML;
            this.welcomeStory = xmlToHtml(this.welcome.querySelector('story').innerHTML);
            this.mapImg = this.map.querySelector('img').innerHTML;
            this.mapImgSize = { width: 0, height: 0 };
        }

        reset() {
            for (let i = 0; i < this.riddles.length; i++) {
                this.riddles[i].bUsed = false;
            }
        }
        get mapRounds() {
            return this.map.querySelector('rounds').children;
        }
    }

    class cProgressBar {
        constructor(id, from, to, cur) {
            let pb = document.getElementById(id);
            this.progressBar = pb.children[0];
            this.progressText = pb.children[1];
            this.from = from;
            this.to = to;
            this.cur = cur;
            this.render();
        }

        render() {
            this.progressBar.style.width = `${(this.cur / (this.to - this.from)) * 100}%`;
            if (this.progressText)
                this.progressText.innerText = this.cur;
        }

        set value(val) {
            this.cur = val;
            this.render();
        }

        get value() {
            return this.cur;
        }

        set min(val) {
            this.from = val;
            this.render();
        }

        get min() {
            return this.from;
        }

        set max(val) {
            this.to = val;
            this.render();
        }

        get max() {
            return this.to;
        }
    }

    function startGame() {
        level = 0;
        game.reset();
        document.getElementById('triesLeft').innerText = '';

        let hidden = document.getElementsByClassName('switchHidden');
        for(let x of hidden) {
            x.classList.add('hidden');
        }

        let body = document.querySelector('body');
        body.style.backgroundImage = `url(${game.welcomeImage})`;

        eleWelcomeStory = document.createElement('div');
        eleWelcomeStory.innerHTML = game.welcomeStory;
        eleWelcomeStory.classList.add('scrollAnimation');
        eleWelcomeStory.classList.add('welcomeStory');
        eleWelcomeStory.addEventListener('animationend', event=> {
            document.querySelector('#btnGo').classList.remove('hidden');
        });
        eleRiddle.appendChild(eleWelcomeStory);
    }

    function clear() {
        for (; eleAnswer.children.length;)
            eleAnswer.removeChild(eleAnswer.children[0]);
        clearInterval(nTimerID);
        eleRiddle.removeChild(eleWelcomeStory);
        curRiddle = null;
        curAnswer = null;
    }

    function doModal(img) {
        let ele = document.getElementById('result');
        ele.style.backgroundImage = `url(${img})`;
        ele.classList.remove('hidden');
        ele.classList.add('modal');
    }

    function onSucceed() {
        clear();
        doModal(game.winImg);
        document.getElementById('resultText').innerText = 'You won! You got it.';
    }

    function onFailed() {
        clear();
        doModal(game.loseImg);
        document.getElementById('resultText').innerText = 'You lost.';
    }

    function onChar(char) {
        if (curRiddle === null)
            return;

        let bAllGuessed = true;
        let hit = false;
        for (let i = 0; i < curAnswer.length; i++) {
            if (curAnswer[i].toLowerCase() === char.toLowerCase()) {
                eleAnswer.children[i].innerText = curAnswer[i];
                hit = true;
            }
            if (eleAnswer.children[i].innerText === '_') {
                bAllGuessed = false;
            }
        }

        if (bAllGuessed) {
            level++;
            if (level === game.mapRounds.length) {
                onSucceed();
            } else {
                playGame();
            }
            return;
        }

        if (!hit) {
            tries++;
            eleTriesLeft.innerText = `Tries left: ${curAnswer.length + 2 - tries}`;
            if (tries === curAnswer.length + 2) {
                onFailed();
            }
        }
    }

    function onKeyInput(event) {
        onChar(event.target.innerText);
    }

    function onKeyPress(event) {
        if (event.key.length != 1)
            return;

        if ((event.key >= 'a' && event.key <= 'z') ||
            (event.key >= 'A' && event.key <= 'Z'))
            onChar(event.key);
    }

    function selectGame(lvl) {
        let lg = [];
        for (let i = 0; i < game.riddles.children.length; i++) {
            if (parseInt(game.riddles.children[i].querySelector('level').innerHTML) === lvl)
                lg.push(i);
        };

        let sel = Math.trunc(Math.random() * lg.length);
        return game.riddles.children[lg[sel]];
    }

    function adjustMapInd() {
        let rd = game.mapRounds[level];
        let size = game.mapImgSize;
        let x = parseInt(rd.querySelector('x').innerHTML);
        let y = parseInt(rd.querySelector('y').innerHTML);
        eleMap.children[0].style.left = `${Math.trunc(eleMap.clientWidth / size.width * x)-28}px`;
        eleMap.children[0].style.top = `${Math.trunc(eleMap.clientHeight / size.height * y)-28}px`;
    }

    function playGame() {
        clear();
        adjustMapInd();
        curRiddle = selectGame(level + 1);

        eleWelcomeStory = document.createElement('div');
        let rdh = document.createElement('div');
        rdh.classList.add('riddleHeader');
        rdh.innerHTML = xmlToHtml(curRiddle.querySelector('title').innerHTML);
        eleWelcomeStory.appendChild(rdh);

        rdh = document.createElement('div');
        rdh.classList.add('riddleStory');
        rdh.innerHTML = xmlToHtml(curRiddle.querySelector('story').innerHTML);
        eleWelcomeStory.appendChild(rdh);

        eleWelcomeStory.classList.add('scrollAnimation');
        eleRiddle.appendChild(eleWelcomeStory);

        curAnswer = curRiddle.querySelector('answer').innerHTML;
        for (let i = 0; i < curAnswer.length; i++) {
            let ele = document.createElement('div');
            ele.classList.add('answer-letter');
            ele.innerText = curAnswer[i] !== ' ' ? '_' : ' ';
            eleAnswer.appendChild(ele);
        }

        progress.value = progress.max = parseInt(curRiddle.querySelector('timeout').innerHTML);
        tries = 0;
        eleTriesLeft.innerText = `Tries left: ${curAnswer.length + 2 - tries}`;

        let body = document.querySelector('body');
        body.style.backgroundImage = `url(${curRiddle.querySelector('img').innerHTML})`;
        nTimerID = setInterval(() => {
            let val = progress.value;
            if (val > 0) {
                val--;
                progress.value = val;
            }
            if (val === 0) {
                onFailed();
            }
        }, 1000);
    }

    function onBtnGoClicked(event) {
        let hidden = document.getElementsByClassName('switchHidden');
        for(let x of hidden) {
            x.classList.remove('hidden');
        }
        event.target.classList.add('hidden');
        eleMap.style.backgroundImage = `url(${game.mapImg})`;

        playGame();
    }

    function onBtnRestartClicked(event) {
        let ele = document.getElementById('result');
        ele.style.backgroundImage = ``;
        ele.classList.add('hidden');
        ele.classList.remove('modal');
        startGame();
    }

    window.onload = function () {
        let key = document.querySelectorAll('.key');
        for (let i = 0; i < key.length; i++) {
            key[i].addEventListener('click', onKeyInput)
        }

        document.querySelector('#btnGo').addEventListener('click', onBtnGoClicked);
        document.querySelector('#btnRestart').addEventListener('click', onBtnRestartClicked);
        window.addEventListener('keypress', onKeyPress);
        progress = new cProgressBar('progress', 0, 60, 0);
        eleRiddle = document.querySelector('#riddle');
        eleMap = document.getElementById('map');
        eleTriesLeft = document.getElementById('triesLeft');
        eleAnswer = document.getElementById('answer');

        fetch('riddles.xml')
        .then(response=> {
            if (response.ok) {
                return response.text();
            }
            throw new Error(riddle.innerText = 'Cannot get riddles.');
        })
        .then(text=> {
            let p = new DOMParser();
            let oDom = p.parseFromString(text, "text/xml");
            game = new cGame(oDom.childNodes[0]);

            loadImage(game.mapImg).then((size) => {
                game.mapImgSize = size;
                startGame();
            });
        });

        setInterval(() => {
            document.getElementById('mapLocation').classList.toggle('hidden');
        }, 500)

        window.addEventListener("resize", function () {
            adjustMapInd();
        });
    }
})();
