import "wired-button";
import "wired-toggle";
import "wired-video";
import "wired-slider";
import "wired-fab";
import "wired-combo";
import "wired-item";
import "wired-card";
import '@material/mwc-icon';
import {html, render} from 'lit-html';
import {repeat} from 'lit-html/directives/repeat';
import screenCord from './screen-cord.js';


export default class SApp extends HTMLElement{
  constructor(){
    super();
    this._shadowRoot = this.attachShadow({mode:'open'});
    this.objectUrl = null;
    this.recorder = null;
  }
  
  get template(){
    return html`
    <style>
      #app-container{
        display:grid;
        max-width:960px;
        margin:0 auto;
        grid-template-rows:120px auto auto auto;
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

      aside,#microphone{
        margin:2rem 0;
        align-self:start;
        justify-self:center;
        line-height:34px;
      }
      wired-combo,wired-toggle{
        vertical-align:middle;
      }
      
      #info{
        margin:2rem 0;
      }

      #info .error{
        color:red;
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
        ScreeCord
      </h1>
      <div id="recorder">
        <h3>Record</h3>
        <wired-fab id="btn-record" class="big"><mwc-icon>fiber_manual_record</mwc-icon></wired-fab>
        <aside>
        
            <span><wired-toggle id="setting-audio" checked></wired-toggle> Record screen audio</span>
            
            <span>
            </span>
            <span><wired-toggle id="setting-cursor" checked></wired-toggle> Record cursor</span>
        </aside>
        <div>
              <span><wired-toggle id="setting-mic"></wired-toggle> Record from microphone</span>
              <span id="microphones">
              <wired-combo disabled>
              </wired-combo>
              </span>
        </div>
        <div id="info">
          <div>Adjust settings if needed and click record if you're ready.</div>
        </div>
      </div>
      <div id="player" style="--aspect-ratio:16/9;">
          <wired-video autoplay></wired-video>
      </div>
      <div id="recorded-info">
      </div>
    </div>`;
  }
  
  _addInfo(id,className,info){
    const divEl = document.createElement('div');
    divEl.classList.add(className);
    divEl.classList.add(id);
    divEl.innerText = info;
    this.shadowRoot.querySelector('#info').appendChild(divEl);
  }
  
  _removeInfo(className){
    this.shadowRoot.querySelector(`.${className}`).remove();
  }
  
  connectedCallback(){
    render(this.template,this.shadowRoot);
    
    this._shadowRoot.querySelector('#btn-record').addEventListener('click',() => {this.toggleCapture()});
    const micSetting = this._shadowRoot.querySelector('#setting-mic');
    micSetting.addEventListener('change',async () => {
      if(micSetting.checked){
        const result = await navigator.permissions.query({name:'microphone'});
          if (result.state == 'granted') {
            this._getAudioInputs();
          } else if (result.state == 'prompt') {
            navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          } else if (result.state == 'denied') {
              this._addInfo('mic-permission','error','Need permission to your microphone, please check your microphone permission on site or privacy settings');
          }
          result.onchange = () => {
            if(result.state == 'granted'){
              this._getAudioInputs();
              this._removeInfo('mic-permission');
            }
              
          };
      }
    });
  }
  
  async _getAudioInputs(){
    const audioInputs = await screenCord.getAudioInputs();
    const innerHtml = html`
        <wired-combo selected="${audioInputs[0].deviceId}">
        ${repeat(audioInputs, (input) => html`
          <wired-item value="${input.deviceId}">${input.label}</wired-item>`)}
        </wired-combo>
    `;
    const micSelect = this.shadowRoot.querySelector('#microphones');
    render(innerHtml,micSelect);
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
  
  initRecorder(){
    const settingMic = this.shadowRoot.querySelector('#setting-mic');
    this.recorder = new screenCord(this._shadowRoot,{
        width: { ideal: window.screen.width },
        height: { ideal: window.screen.height },
        cursor: this._shadowRoot.querySelector('#setting-cursor').checked?"always":"never",
        aspectRatio: 1.777777778,
        frameRate: { max: 30 }
    },this._shadowRoot.querySelector('#setting-audio').checked?{
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    }:false,
    settingMic.checked?{
  audio: {
    deviceId: settingMic.selected
  }
}:null);
    
    this.recorder.onRecordingStop = (blob) => {
      this.objectUrl= URL.createObjectURL(blob);
      const downloadElement = this.createDownloadElement();
      const recordedInfo = this._shadowRoot.querySelector('#recorded-info');
      recordedInfo.appendChild(downloadElement);
      recordedInfo.style.display = 'block';

      const player = this._shadowRoot.querySelector('#player');
      player.style.display = 'block';
      this._shadowRoot.querySelector('#player wired-video').setAttribute('src',this.objectUrl);
      this._shadowRoot.querySelector('#recorder').style.display = 'none';
    };
  }
}

customElements.define('s-app',SApp);