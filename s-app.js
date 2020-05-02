import { WiredButton } from "wired-button";
import { WiredToggle } from "wired-toggle";
import { WiredVideo } from "wired-video";
import { WiredSlider } from "wired-slider";
import { WiredFab } from "wired-fab";
import '@material/mwc-icon';
import screenCord from './screen-cord.js';

export default class SApp extends HTMLElement{
  constructor(){
    super();
    this._shadowRoot = this.attachShadow({mode:'open'});
    this.objectUrl = null;
    this.recorder = null;
  }

async toggleCapture(){
  if(!this.recorder) this.initRecorder();
  
  if(this.recorder.mediaRecorder && this.recorder.mediaRecorder.state === 'inactive'){
    await this.recorder.toggleCapture();
  } else{
    await this.recorder.toggleCapture();
  }
  
}

createDownloadElement() {
    const a = document.createElement("a");
    a.setAttribute('id','btn-download');
    document.body.appendChild(a);
    a.innerHTML = 'Download';
    a.href = this.objectUrl;
    a.download = "recorded-screen.webm";
    return a;
  }
  
  get template(){
    return `
    <style>
      #app-container{
        display:grid;
        max-width:960px;
        margin:0 auto;
        grid-template-rows:160px auto 64px auto;
        grid-template-columns:1fr;
        align-items: center;
        justify-content:center;
        height:100vh;
        text-align:center;
      }

      #btn-record{
        align-self:end;
        justify-self:center;
        height:8rem;
        width:8rem;
        border-radius:4rem
        color:#FFF;
      }

      h1 {
        color: #373fff;
        text-align:center;
        align-self:end;
      }

      aside{
        margin:2rem 0;
        align-self:start;
        justify-self:center;
        line-height:34px;
      }
      aside wired-toggle{
        vertical-align:middle;
      }

      .big{
        --wired-icon-size:56px;
      }

      #player,#recorded-info{
        display:none;
      }

      [style*="--aspect-ratio"] > :first-child {
        width: 100%;
      }
      [style*="--aspect-ratio"] > img {  
        height: auto;
      } 

      @supports (--custom:property) {
        [style*="--aspect-ratio"] {
          position: relative;
        }
        [style*="--aspect-ratio"]::before {
          content: "";
          display: block;
          padding-bottom: calc(100% / (var(--aspect-ratio)));
        }  
        [style*="--aspect-ratio"] > :first-child {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
        }  
      }
      
      #video-editor{
        position:relative;
      }
      
      #video-editor wired-slider{
        position:absolute;
        top:0;
        left:0;
      }
    </style>
    <div id="app-container">
      <h1>
        ScreenCord
      </h1>
      <div id="recorder">
        <h3>Record</h3>
        <wired-fab id="btn-record" class="big"><mwc-icon>fiber_manual_record</mwc-icon></wired-fab>
        <aside>
        
            <span><wired-toggle id="setting-audio" checked></wired-toggle> Record audio</span>

            <span><wired-toggle id="setting-cursor" checked></wired-toggle> Record cursor</span>

        </aside>
        <div>
          Adjust setting if needed and click record if you're ready.
        </div>
      </div>
      <div id="player" style="--aspect-ratio:16/9;">
          <wired-video autoplay></wired-video>
      </div>
      <div id="recorded-info">
        
      </div>
      // <div id="video-editor">
      //     <wired-slider id="trim-start" pin max="50" value="0" ></wired-slider>
      //     <wired-slider id="trim-end" pin max="50" value="0" ></wired-slider>
      // </div>
      
    </div>`;
  }
  connectedCallback(){
    this._shadowRoot.innerHTML = this.template;
    this._shadowRoot.querySelector('#btn-record').addEventListener('click',() => {this.toggleCapture()});
    
  }
  
  initRecorder(){
    this.recorder = new screenCord(this._shadowRoot,{
        width: { ideal: window.screen.width },
        height: { ideal: window.screen.height },
        cursor: this._shadowRoot.querySelector('#setting-audio').getAttribute('checked')?"always":"never",
        aspectRatio: 1.777777778,
        frameRate: { max: 30 }
    },this._shadowRoot.querySelector('#setting-audio').getAttribute('checked')?{
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    }:false);
    
    this.recorder.onRecordingStop = (blob) => {
      this.objectUrl= URL.createObjectURL(blob);
      const downloadElement = this.createDownloadElement();
      const recordedInfo = this._shadowRoot.querySelector('#recorded-info');
      recordedInfo.appendChild(downloadElement);
      recordedInfo.style.display = 'block';

      const player = this._shadowRoot.querySelector('#player');
      player.style.display = 'block';
      this._shadowRoot.querySelector('#player video').setAttribute('src',this.objectUrl);
      this._shadowRoot.querySelector('#recorder').style.display = 'none';
    };
  }
}

customElements.define('s-app',SApp);