var Jukebox = {
  _ctx: null,
  _audio: new Audio(),
  _data: null,
  _analyser: null,
  _last: {
    ts: 0,
    value: 0,
  },
  _decay: 300,
  _playlistIndex: -1,
  _playlist: [
    { name: "Happy Teacher's Day\n Love You Forever", file: 'teacher.mp3' },
  ],

  handleEvent: function (e) {
    switch (e.type) {
      case 'load':
        this._init();
        break;

      case 'ended':
        document.querySelector('#banner').innerHTML = '';
        if (this._playlistIndex > -1) {
          this._next();
        }
        break;

      case 'submit':
        e.preventDefault();
        if (e.target.id != 'url') {
          return;
        }
        var url = document.querySelector('#url input');
        if (!url.value) {
          return;
        }
        this._play(url.value);
        break;

      case 'change':
        if (!e.target.files.length) {
          return;
        }
        var file = e.target.files[0];
        if (!this._testType(file.type)) {
          return;
        }
        var url = URL.createObjectURL(file);
        this._play(url, file.name);
        break;

      case 'click':
        this['_' + e.target.id]();
        break;
    }
  },

  _init: function () {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      alert(
        'Sorry, no Web Audio API support detected. Get a modern browser and come back again.'
      );
      return;
    }

    this._audio.addEventListener('ended', this);

    this._analyser = this._ctx.createAnalyser();
    this._analyser.fftSize = 1024;
    this._analyser.maxDecibels = -20;
    this._analyser.smoothingTimeConstant = 0.5;
    this._analyser.connect(this._ctx.destination);

    var source = this._ctx.createMediaElementSource(this._audio);
    source.connect(this._analyser);
    this._data = new Uint8Array(this._analyser.frequencyBinCount);

    //		this._next();

    this._tick = this._tick.bind(this);
    setInterval(this._tick, 1000);

    document.querySelector('#banner').innerHTML =
      "Happy Teacher's Day\n\nLove You Forever\n\nClick To Start";
    let onclick = () => {
      document.body.removeEventListener('click', onclick);
      // Resume the audio context now that the user has interacted with page
      // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
      this._ctx.resume();
      this._next();
    };
    document.body.addEventListener('click', onclick);
  },

  _testType: function (type) {
    if (!this._audio.canPlayType(type)) {
      alert(
        'Sorry, this file type (' + type + ') is not supported by your browser.'
      );
      return false;
    } else {
      return true;
    }
  },

  _play: function (url, name) {
    this._audio.src = url;
    this._audio.play();
    document.querySelector('#banner').innerHTML = name || url;
  },

  _next: function () {
    this._playList(this._playlistIndex + 1);
  },

  _prev: function () {
    this._playList(this._playlistIndex - 1);
  },

  _playList: function (index) {
    this._playlistIndex =
      (index + this._playlist.length) % this._playlist.length;
    var item = this._playlist[this._playlistIndex];
    this._play('ogg/' + item.file, item.name);
  },

  _tick: function () {
    this._analyser.getByteFrequencyData(this._data);

    /* current values */
    var now = Date.now();
    var value = this._data[0];

    /* diffs */
    var delta = value - this._last.value;
    var timeDiff = now - this._last.ts;

    /* always maintain last */
    this._last.value = value;

    if (timeDiff < this._decay) {
      /* decay */
      this._last.value = value;
      return;
    }

    if (delta > 0) {
      this._last.ts = now;
      var force = delta / 50;
      Render.scene.push(new Explosion(Render.gl, force));

      /* one more! */
      if (force > 1.1) {
        Render.scene.push(new Explosion(Render.gl, 1));
      }
    }
  },
};
window.addEventListener('load', Jukebox);
