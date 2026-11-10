import{p as ne}from"./chunk-NS7ILQ57.js";import{K as Kt,L as Ut,O as Jt,Y as te,fa as ee}from"./chunk-L2KMH7KE.js";import{Gc as Yt,Hc as Zt,Ic as Xt,ya as Bt}from"./chunk-LXYVNEQN.js";import{f as V}from"./chunk-PBGY4Z6B.js";import{a as ut,b as Ht,c as zt,f as N,h as Z,j as qt,k as Gt,l as Wt,o as X,q as Qt}from"./chunk-GMVGJLEN.js";import{c as jt}from"./chunk-BABNE476.js";import{d as $t}from"./chunk-SMHVPIP2.js";import{d as U,g as Rt,k as Nt,l as Vt,p as Y,s as R}from"./chunk-Z4OAUQEJ.js";import{e as mt}from"./chunk-KAOBSZ77.js";import{a as ct}from"./chunk-NRLBW6BM.js";import{a as Ft}from"./chunk-4NIYA5MS.js";import{h as ie}from"./chunk-UFOEZSKV.js";import{B as dt}from"./chunk-RP5ZVR5S.js";import{Aa as Dt,Ad as Pt,Bc as Mt,C as yt,Cc as St,D as y,Da as W,Dc as Lt,Ea as xt,F as Ct,Gb as w,Ha as Tt,Ib as k,Ic as lt,J as T,Jc as E,Ka as At,Kb as $,Kc as P,Lb as O,Lc as D,Ma as wt,Mb as K,Na as Q,Nc as x,Pa as I,_b as f,aa as q,ba as vt,bc as M,cc as S,e as p,ed as B,fd as F,g as it,hc as at,ic as C,jc as v,ka as G,na as g,nb as A,p as _t,pa as a,pd as _,rc as st,sb as kt,sc as rt,td as Et,u as bt,ud as c,va as nt,vb as Ot,vc as L,wa as ot,xc as d,y as z,yb as It,za as h}from"./chunk-YQIVR7FX.js";import{a as u,b as ft}from"./chunk-JGDRNPQP.js";function ye(i,o){}var b=class{viewContainerRef;injector;id;role="dialog";panelClass="";hasBackdrop=!0;backdropClass="";disableClose=!1;closePredicate;width="";height="";minWidth;minHeight;maxWidth;maxHeight;positionStrategy;data=null;direction;ariaDescribedBy=null;ariaLabelledBy=null;ariaLabel=null;ariaModal=!1;autoFocus="first-tabbable";restoreFocus=!0;scrollStrategy;closeOnNavigation=!0;closeOnDestroy=!0;closeOnOverlayDetachments=!0;disableAnimations=!1;providers;container;templateContext};var pt=(()=>{class i extends zt{_elementRef=a(I);_focusTrapFactory=a(Vt);_config;_interactivityChecker=a(Nt);_ngZone=a(xt);_focusMonitor=a(Rt);_renderer=a(It);_changeDetectorRef=a(Pt);_injector=a(h);_platform=a(Ft);_document=a(Dt);_portalOutlet;_focusTrapped=new p;_focusTrap=null;_elementFocusedBeforeDialogWasOpened=null;_closeInteractionType=null;_ariaLabelledByQueue=[];_isDestroyed=!1;constructor(){super(),this._config=a(b,{optional:!0})||new b,this._config.ariaLabelledBy&&this._ariaLabelledByQueue.push(this._config.ariaLabelledBy)}_addAriaLabelledBy(t){this._ariaLabelledByQueue.push(t),this._changeDetectorRef.markForCheck()}_removeAriaLabelledBy(t){let e=this._ariaLabelledByQueue.indexOf(t);e>-1&&(this._ariaLabelledByQueue.splice(e,1),this._changeDetectorRef.markForCheck())}_contentAttached(){this._initializeFocusTrap(),this._captureInitialFocus()}_captureInitialFocus(){this._trapFocus()}ngOnDestroy(){this._focusTrapped.complete(),this._isDestroyed=!0,this._restoreFocus()}attachComponentPortal(t){this._portalOutlet.hasAttached();let e=this._portalOutlet.attachComponentPortal(t);return this._contentAttached(),e}attachTemplatePortal(t){this._portalOutlet.hasAttached();let e=this._portalOutlet.attachTemplatePortal(t);return this._contentAttached(),e}attachDomPortal=t=>{this._portalOutlet.hasAttached();let e=this._portalOutlet.attachDomPortal(t);return this._contentAttached(),e};_recaptureFocus(){this._containsFocus()||this._trapFocus()}_forceFocus(t,e){this._interactivityChecker.isFocusable(t)||(t.tabIndex=-1,this._ngZone.runOutsideAngular(()=>{let n=()=>{s(),l(),t.removeAttribute("tabindex")},s=this._renderer.listen(t,"blur",n),l=this._renderer.listen(t,"mousedown",n)})),t.focus(e)}_focusByCssSelector(t,e){let n=this._elementRef.nativeElement.querySelector(t);n&&this._forceFocus(n,e)}_trapFocus(t){this._isDestroyed||kt(()=>{let e=this._elementRef.nativeElement;switch(this._config.autoFocus){case!1:case"dialog":this._containsFocus()||e.focus(t);break;case!0:case"first-tabbable":this._focusTrap?.focusInitialElement(t)||this._focusDialogContainer(t);break;case"first-heading":this._focusByCssSelector('h1, h2, h3, h4, h5, h6, [role="heading"]',t);break;default:this._focusByCssSelector(this._config.autoFocus,t);break}this._focusTrapped.next()},{injector:this._injector})}_restoreFocus(){let t=this._config.restoreFocus,e=null;if(typeof t=="string"?e=this._document.querySelector(t):typeof t=="boolean"?e=t?this._elementFocusedBeforeDialogWasOpened:null:t&&(e=t),this._config.restoreFocus&&e&&typeof e.focus=="function"){let n=U(),s=this._elementRef.nativeElement;(!n||n===this._document.body||n===s||s.contains(n))&&(this._focusMonitor?(this._focusMonitor.focusVia(e,this._closeInteractionType),this._closeInteractionType=null):e.focus())}this._focusTrap&&this._focusTrap.destroy()}_focusDialogContainer(t){this._elementRef.nativeElement.focus?.(t)}_containsFocus(){let t=this._elementRef.nativeElement,e=U();return t===e||t.contains(e)}_initializeFocusTrap(){this._platform.isBrowser&&(this._focusTrap=this._focusTrapFactory.create(this._elementRef.nativeElement),this._document&&(this._elementFocusedBeforeDialogWasOpened=U()))}static \u0275fac=function(e){return new(e||i)};static \u0275cmp=w({type:i,selectors:[["cdk-dialog-container"]],viewQuery:function(e,n){if(e&1&&Mt(N,7),e&2){let s;St(s=Lt())&&(n._portalOutlet=s.first)}},hostAttrs:["tabindex","-1",1,"cdk-dialog-container"],hostVars:6,hostBindings:function(e,n){e&2&&f("id",n._config.id||null)("role",n._config.role)("aria-modal",n._config.ariaModal)("aria-labelledby",n._config.ariaLabel?null:n._ariaLabelledByQueue[0])("aria-label",n._config.ariaLabel)("aria-describedby",n._config.ariaDescribedBy||null)},features:[O],decls:1,vars:0,consts:[["cdkPortalOutlet",""]],template:function(e,n){e&1&&K(0,ye,0,0,"ng-template",0)},dependencies:[N],styles:[`.cdk-dialog-container {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  max-height: inherit;
}
`],encapsulation:2})}return i})(),j=class{overlayRef;config;componentInstance=null;componentRef=null;containerInstance;disableClose;closed=new p;backdropClick;keydownEvents;outsidePointerEvents;id;_detachSubscription;constructor(o,t){this.overlayRef=o,this.config=t,this.disableClose=t.disableClose,this.backdropClick=o.backdropClick(),this.keydownEvents=o.keydownEvents(),this.outsidePointerEvents=o.outsidePointerEvents(),this.id=t.id,this.keydownEvents.subscribe(e=>{e.keyCode===27&&!this.disableClose&&!Y(e)&&(e.preventDefault(),this.close(void 0,{focusOrigin:"keyboard"}))}),this.backdropClick.subscribe(()=>{!this.disableClose&&this._canClose()?this.close(void 0,{focusOrigin:"mouse"}):this.containerInstance._recaptureFocus?.()}),this._detachSubscription=o.detachments().subscribe(()=>{t.closeOnOverlayDetachments!==!1&&this.close()})}close(o,t){if(this._canClose(o)){let e=this.closed;this.containerInstance._closeInteractionType=t?.focusOrigin||"program",this._detachSubscription.unsubscribe(),this.overlayRef.dispose(),e.next(o),e.complete(),this.componentInstance=this.containerInstance=null}}updatePosition(){return this.overlayRef.updatePosition(),this}updateSize(o="",t=""){return this.overlayRef.updateSize({width:o,height:t}),this}addPanelClass(o){return this.overlayRef.addPanelClass(o),this}removePanelClass(o){return this.overlayRef.removePanelClass(o),this}_canClose(o){let t=this.config;return!!this.containerInstance&&(!t.closePredicate||t.closePredicate(o,t,this.componentInstance))}},Ce=new g("DialogScrollStrategy",{providedIn:"root",factory:()=>{let i=a(h);return()=>Z(i)}}),ve=new g("DialogData"),De=new g("DefaultDialogConfig");function xe(i){let o=Tt(i),t=new W;return{valueSignal:o,get value(){return o()},change:t,ngOnDestroy(){t.complete()}}}var se=(()=>{class i{_injector=a(h);_defaultOptions=a(De,{optional:!0});_parentDialog=a(i,{optional:!0,skipSelf:!0});_overlayContainer=a(Gt);_idGenerator=a(R);_openDialogsAtThisLevel=[];_afterAllClosedAtThisLevel=new p;_afterOpenedAtThisLevel=new p;_ariaHiddenElements=new Map;_scrollStrategy=a(Ce);get openDialogs(){return this._parentDialog?this._parentDialog.openDialogs:this._openDialogsAtThisLevel}get afterOpened(){return this._parentDialog?this._parentDialog.afterOpened:this._afterOpenedAtThisLevel}afterAllClosed=z(()=>this.openDialogs.length?this._getAfterAllClosed():this._getAfterAllClosed().pipe(q(void 0)));constructor(){}open(t,e){let n=this._defaultOptions||new b;e=u(u({},n),e),e.id=e.id||this._idGenerator.getId("cdk-dialog-"),e.id&&this.getDialogById(e.id);let s=this._getOverlayConfig(e),l=Qt(this._injector,s),r=new j(l,e),m=this._attachContainer(l,r,e);if(r.containerInstance=m,!this.openDialogs.length){let et=this._overlayContainer.getContainerElement();m._focusTrapped?m._focusTrapped.pipe(T(1)).subscribe(()=>{this._hideNonDialogContentFromAssistiveTechnology(et)}):this._hideNonDialogContentFromAssistiveTechnology(et)}return this._attachDialogContent(t,r,m,e),this.openDialogs.push(r),r.closed.subscribe(()=>this._removeOpenDialog(r,!0)),this.afterOpened.next(r),r}closeAll(){ht(this.openDialogs,t=>t.close())}getDialogById(t){return this.openDialogs.find(e=>e.id===t)}ngOnDestroy(){ht(this._openDialogsAtThisLevel,t=>{t.config.closeOnDestroy===!1&&this._removeOpenDialog(t,!1)}),ht(this._openDialogsAtThisLevel,t=>t.close()),this._afterAllClosedAtThisLevel.complete(),this._afterOpenedAtThisLevel.complete(),this._openDialogsAtThisLevel=[]}_getOverlayConfig(t){let e=new qt({positionStrategy:t.positionStrategy||X().centerHorizontally().centerVertically(),scrollStrategy:t.scrollStrategy||this._scrollStrategy(),panelClass:t.panelClass,hasBackdrop:t.hasBackdrop,direction:t.direction,minWidth:t.minWidth,minHeight:t.minHeight,maxWidth:t.maxWidth,maxHeight:t.maxHeight,width:t.width,height:t.height,disposeOnNavigation:t.closeOnNavigation,disableAnimations:t.disableAnimations});return t.backdropClass&&(e.backdropClass=t.backdropClass),e}_attachContainer(t,e,n){let s=n.injector||n.viewContainerRef?.injector,l=[{provide:b,useValue:n},{provide:j,useValue:e},{provide:Wt,useValue:t}],r;n.container?typeof n.container=="function"?r=n.container:(r=n.container.type,l.push(...n.container.providers(n))):r=pt;let m=new ut(r,n.viewContainerRef,h.create({parent:s||this._injector,providers:l}));return t.attach(m).instance}_attachDialogContent(t,e,n,s){if(t instanceof Ot){let l=this._createInjector(s,e,n,void 0),r={$implicit:s.data,dialogRef:e};s.templateContext&&(r=u(u({},r),typeof s.templateContext=="function"?s.templateContext():s.templateContext)),n.attachTemplatePortal(new Ht(t,null,r,l))}else{let l=this._createInjector(s,e,n,this._injector),r=n.attachComponentPortal(new ut(t,s.viewContainerRef,l));e.componentRef=r,e.componentInstance=r.instance}}_createInjector(t,e,n,s){let l=t.injector||t.viewContainerRef?.injector,r=[{provide:ve,useValue:t.data},{provide:j,useValue:e}];return t.providers&&(typeof t.providers=="function"?r.push(...t.providers(e,t,n)):r.push(...t.providers)),t.direction&&(!l||!l.get(dt,null,{optional:!0}))&&r.push({provide:dt,useValue:xe(t.direction)}),h.create({parent:l||s,providers:r})}_removeOpenDialog(t,e){let n=this.openDialogs.indexOf(t);n>-1&&(this.openDialogs.splice(n,1),this.openDialogs.length||(this._ariaHiddenElements.forEach((s,l)=>{s?l.setAttribute("aria-hidden",s):l.removeAttribute("aria-hidden")}),this._ariaHiddenElements.clear(),e&&this._getAfterAllClosed().next()))}_hideNonDialogContentFromAssistiveTechnology(t){if(t.parentElement){let e=t.parentElement.children;for(let n=e.length-1;n>-1;n--){let s=e[n];s!==t&&s.nodeName!=="SCRIPT"&&s.nodeName!=="STYLE"&&!s.hasAttribute("aria-live")&&!s.hasAttribute("popover")&&(this._ariaHiddenElements.set(s,s.getAttribute("aria-hidden")),s.setAttribute("aria-hidden","true"))}}}_getAfterAllClosed(){let t=this._parentDialog;return t?t._getAfterAllClosed():this._afterAllClosedAtThisLevel}static \u0275fac=function(e){return new(e||i)};static \u0275prov=G({token:i,factory:i.\u0275fac,providedIn:"root"})}return i})();function ht(i,o){let t=i.length;for(;t--;)o(i[t])}function Te(i,o){}var tt=class{viewContainerRef;injector;id;role="dialog";panelClass="";hasBackdrop=!0;backdropClass="";disableClose=!1;closePredicate;width="";height="";minWidth;minHeight;maxWidth;maxHeight;position;data=null;direction;ariaDescribedBy=null;ariaLabelledBy=null;ariaLabel=null;ariaModal=!1;autoFocus="first-tabbable";restoreFocus=!0;delayFocusTrap=!0;scrollStrategy;closeOnNavigation=!0;enterAnimationDuration;exitAnimationDuration},gt="mdc-dialog--open",re="mdc-dialog--opening",le="mdc-dialog--closing",Ae=150,we=75,ke=(()=>{class i extends pt{_animationStateChanged=new W;_animationsEnabled=!mt();_actionSectionCount=0;_hostElement=this._elementRef.nativeElement;_enterAnimationDuration=this._animationsEnabled?de(this._config.enterAnimationDuration)??Ae:0;_exitAnimationDuration=this._animationsEnabled?de(this._config.exitAnimationDuration)??we:0;_animationTimer=null;_contentAttached(){super._contentAttached(),this._startOpenAnimation()}_startOpenAnimation(){this._animationStateChanged.emit({state:"opening",totalTime:this._enterAnimationDuration}),this._animationsEnabled?(this._hostElement.style.setProperty(ce,`${this._enterAnimationDuration}ms`),this._requestAnimationFrame(()=>this._hostElement.classList.add(re,gt)),this._waitForAnimationToComplete(this._enterAnimationDuration,this._finishDialogOpen)):(this._hostElement.classList.add(gt),Promise.resolve().then(()=>this._finishDialogOpen()))}_startExitAnimation(){this._animationStateChanged.emit({state:"closing",totalTime:this._exitAnimationDuration}),this._hostElement.classList.remove(gt),this._animationsEnabled?(this._hostElement.style.setProperty(ce,`${this._exitAnimationDuration}ms`),this._requestAnimationFrame(()=>this._hostElement.classList.add(le)),this._waitForAnimationToComplete(this._exitAnimationDuration,this._finishDialogClose)):Promise.resolve().then(()=>this._finishDialogClose())}_updateActionSectionCount(t){this._actionSectionCount+=t,this._changeDetectorRef.markForCheck()}_finishDialogOpen=()=>{this._clearAnimationClasses(),this._openAnimationDone(this._enterAnimationDuration)};_finishDialogClose=()=>{this._clearAnimationClasses(),this._animationStateChanged.emit({state:"closed",totalTime:this._exitAnimationDuration})};_clearAnimationClasses(){this._hostElement.classList.remove(re,le)}_waitForAnimationToComplete(t,e){this._animationTimer!==null&&clearTimeout(this._animationTimer),this._animationTimer=setTimeout(e,t)}_requestAnimationFrame(t){this._ngZone.runOutsideAngular(()=>{typeof requestAnimationFrame=="function"?requestAnimationFrame(t):t()})}_captureInitialFocus(){this._config.delayFocusTrap||this._trapFocus()}_openAnimationDone(t){this._config.delayFocusTrap&&this._trapFocus(),this._animationStateChanged.next({state:"opened",totalTime:t})}ngOnDestroy(){super.ngOnDestroy(),this._animationTimer!==null&&clearTimeout(this._animationTimer)}attachComponentPortal(t){let e=super.attachComponentPortal(t);return e.location.nativeElement.classList.add("mat-mdc-dialog-component-host"),e}static \u0275fac=(()=>{let t;return function(n){return(t||(t=Q(i)))(n||i)}})();static \u0275cmp=w({type:i,selectors:[["mat-dialog-container"]],hostAttrs:["tabindex","-1",1,"mat-mdc-dialog-container","mdc-dialog"],hostVars:10,hostBindings:function(e,n){e&2&&(rt("id",n._config.id),f("aria-modal",n._config.ariaModal)("role",n._config.role)("aria-labelledby",n._config.ariaLabel?null:n._ariaLabelledByQueue[0])("aria-label",n._config.ariaLabel)("aria-describedby",n._config.ariaDescribedBy||null),E("_mat-animation-noopable",!n._animationsEnabled)("mat-mdc-dialog-container-with-actions",n._actionSectionCount>0))},features:[O],decls:3,vars:0,consts:[[1,"mat-mdc-dialog-inner-container","mdc-dialog__container"],[1,"mat-mdc-dialog-surface","mdc-dialog__surface"],["cdkPortalOutlet",""]],template:function(e,n){e&1&&(C(0,"div",0)(1,"div",1),K(2,Te,0,0,"ng-template",2),v()())},dependencies:[N],styles:[`.mat-mdc-dialog-container {
  width: 100%;
  height: 100%;
  display: block;
  box-sizing: border-box;
  max-height: inherit;
  min-height: inherit;
  min-width: inherit;
  max-width: inherit;
  outline: 0;
}

.cdk-overlay-pane.mat-mdc-dialog-panel {
  max-width: var(--mat-dialog-container-max-width, 560px);
  min-width: var(--mat-dialog-container-min-width, 280px);
}
@media (max-width: 599px) {
  .cdk-overlay-pane.mat-mdc-dialog-panel {
    max-width: var(--mat-dialog-container-small-max-width, calc(100vw - 32px));
  }
}

.mat-mdc-dialog-inner-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  box-sizing: border-box;
  height: 100%;
  opacity: 0;
  transition: opacity linear var(--mat-dialog-transition-duration, 0ms);
  max-height: inherit;
  min-height: inherit;
  min-width: inherit;
  max-width: inherit;
}
.mdc-dialog--closing .mat-mdc-dialog-inner-container {
  transition: opacity 75ms linear;
  transform: none;
}
.mdc-dialog--open .mat-mdc-dialog-inner-container {
  opacity: 1;
}
._mat-animation-noopable .mat-mdc-dialog-inner-container {
  transition: none;
}

.mat-mdc-dialog-surface {
  display: flex;
  flex-direction: column;
  flex-grow: 0;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  overflow-y: auto;
  outline: 0;
  transform: scale(0.8);
  transition: transform var(--mat-dialog-transition-duration, 0ms) cubic-bezier(0, 0, 0.2, 1);
  max-height: inherit;
  min-height: inherit;
  min-width: inherit;
  max-width: inherit;
  box-shadow: var(--mat-dialog-container-elevation-shadow, none);
  border-radius: var(--mat-dialog-container-shape, var(--mat-sys-corner-extra-large, 4px));
  background-color: var(--mat-dialog-container-color, var(--mat-sys-surface, white));
}
[dir=rtl] .mat-mdc-dialog-surface {
  text-align: right;
}
.mdc-dialog--open .mat-mdc-dialog-surface, .mdc-dialog--closing .mat-mdc-dialog-surface {
  transform: none;
}
._mat-animation-noopable .mat-mdc-dialog-surface {
  transition: none;
}
.mat-mdc-dialog-surface::before {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border: 2px solid transparent;
  border-radius: inherit;
  content: "";
  pointer-events: none;
}

.mat-mdc-dialog-title {
  display: block;
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
  margin: 0 0 1px;
  padding: var(--mat-dialog-headline-padding, 6px 24px 13px);
}
.mat-mdc-dialog-title::before {
  display: inline-block;
  width: 0;
  height: 40px;
  content: "";
  vertical-align: 0;
}
[dir=rtl] .mat-mdc-dialog-title {
  text-align: right;
}
.mat-mdc-dialog-container .mat-mdc-dialog-title {
  color: var(--mat-dialog-subhead-color, var(--mat-sys-on-surface, rgba(0, 0, 0, 0.87)));
  font-family: var(--mat-dialog-subhead-font, var(--mat-sys-headline-small-font, inherit));
  line-height: var(--mat-dialog-subhead-line-height, var(--mat-sys-headline-small-line-height, 1.5rem));
  font-size: var(--mat-dialog-subhead-size, var(--mat-sys-headline-small-size, 1rem));
  font-weight: var(--mat-dialog-subhead-weight, var(--mat-sys-headline-small-weight, 400));
  letter-spacing: var(--mat-dialog-subhead-tracking, var(--mat-sys-headline-small-tracking, 0.03125em));
}

.mat-mdc-dialog-content {
  display: block;
  flex-grow: 1;
  box-sizing: border-box;
  margin: 0;
  overflow: auto;
  max-height: 65vh;
}
.mat-mdc-dialog-content > :first-child {
  margin-top: 0;
}
.mat-mdc-dialog-content > :last-child {
  margin-bottom: 0;
}
.mat-mdc-dialog-container .mat-mdc-dialog-content {
  color: var(--mat-dialog-supporting-text-color, var(--mat-sys-on-surface-variant, rgba(0, 0, 0, 0.6)));
  font-family: var(--mat-dialog-supporting-text-font, var(--mat-sys-body-medium-font, inherit));
  line-height: var(--mat-dialog-supporting-text-line-height, var(--mat-sys-body-medium-line-height, 1.5rem));
  font-size: var(--mat-dialog-supporting-text-size, var(--mat-sys-body-medium-size, 1rem));
  font-weight: var(--mat-dialog-supporting-text-weight, var(--mat-sys-body-medium-weight, 400));
  letter-spacing: var(--mat-dialog-supporting-text-tracking, var(--mat-sys-body-medium-tracking, 0.03125em));
}
.mat-mdc-dialog-container .mat-mdc-dialog-content {
  padding: var(--mat-dialog-content-padding, 20px 24px);
}
.mat-mdc-dialog-container-with-actions .mat-mdc-dialog-content {
  padding: var(--mat-dialog-with-actions-content-padding, 20px 24px 0);
}
.mat-mdc-dialog-container .mat-mdc-dialog-title + .mat-mdc-dialog-content {
  padding-top: 0;
}

.mat-mdc-dialog-actions {
  display: flex;
  position: relative;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  box-sizing: border-box;
  min-height: 52px;
  margin: 0;
  border-top: 1px solid transparent;
  padding: var(--mat-dialog-actions-padding, 16px 24px);
  justify-content: var(--mat-dialog-actions-alignment, flex-end);
}
@media (forced-colors: active) {
  .mat-mdc-dialog-actions {
    border-top-color: CanvasText;
  }
}
.mat-mdc-dialog-actions.mat-mdc-dialog-actions-align-start, .mat-mdc-dialog-actions[align=start] {
  justify-content: start;
}
.mat-mdc-dialog-actions.mat-mdc-dialog-actions-align-center, .mat-mdc-dialog-actions[align=center] {
  justify-content: center;
}
.mat-mdc-dialog-actions.mat-mdc-dialog-actions-align-end, .mat-mdc-dialog-actions[align=end] {
  justify-content: flex-end;
}
.mat-mdc-dialog-actions .mat-button-base + .mat-button-base,
.mat-mdc-dialog-actions .mat-mdc-button-base + .mat-mdc-button-base {
  margin-left: 8px;
}
[dir=rtl] .mat-mdc-dialog-actions .mat-button-base + .mat-button-base,
[dir=rtl] .mat-mdc-dialog-actions .mat-mdc-button-base + .mat-mdc-button-base {
  margin-left: 0;
  margin-right: 8px;
}

.mat-mdc-dialog-component-host {
  display: contents;
}
`],encapsulation:2})}return i})(),ce="--mat-dialog-transition-duration";function de(i){return i==null?null:typeof i=="number"?i:i.endsWith("ms")?ct(i.substring(0,i.length-2)):i.endsWith("s")?ct(i.substring(0,i.length-1))*1e3:i==="0"?0:null}var J=(function(i){return i[i.OPEN=0]="OPEN",i[i.CLOSING=1]="CLOSING",i[i.CLOSED=2]="CLOSED",i})(J||{}),H=class{_ref;_config;_containerInstance;componentInstance;componentRef=null;disableClose;id;_afterOpened=new it(1);_beforeClosed=new it(1);_result;_closeFallbackTimeout;_state=J.OPEN;_closeInteractionType;constructor(o,t,e){this._ref=o,this._config=t,this._containerInstance=e,this.disableClose=t.disableClose,this.id=o.id,o.addPanelClass("mat-mdc-dialog-panel"),e._animationStateChanged.pipe(y(n=>n.state==="opened"),T(1)).subscribe(()=>{this._afterOpened.next(),this._afterOpened.complete()}),e._animationStateChanged.pipe(y(n=>n.state==="closed"),T(1)).subscribe(()=>{clearTimeout(this._closeFallbackTimeout),this._finishDialogClose()}),o.overlayRef.detachments().subscribe(()=>{this._beforeClosed.next(this._result),this._beforeClosed.complete(),this._finishDialogClose()}),yt(this.backdropClick(),this.keydownEvents().pipe(y(n=>n.keyCode===27&&!this.disableClose&&!Y(n)))).subscribe(n=>{this.disableClose||(n.preventDefault(),me(this,n.type==="keydown"?"keyboard":"mouse"))})}close(o){let t=this._config.closePredicate;t&&!t(o,this._config,this.componentInstance)||(this._result=o,this._containerInstance._animationStateChanged.pipe(y(e=>e.state==="closing"),T(1)).subscribe(e=>{this._beforeClosed.next(o),this._beforeClosed.complete(),this._ref.overlayRef.detachBackdrop(),this._closeFallbackTimeout=setTimeout(()=>this._finishDialogClose(),e.totalTime+100)}),this._state=J.CLOSING,this._containerInstance._startExitAnimation())}afterOpened(){return this._afterOpened}afterClosed(){return this._ref.closed}beforeClosed(){return this._beforeClosed}backdropClick(){return this._ref.backdropClick}keydownEvents(){return this._ref.keydownEvents}updatePosition(o){let t=this._ref.config.positionStrategy;return o&&(o.left||o.right)?o.left?t.left(o.left):t.right(o.right):t.centerHorizontally(),o&&(o.top||o.bottom)?o.top?t.top(o.top):t.bottom(o.bottom):t.centerVertically(),this._ref.updatePosition(),this}updateSize(o="",t=""){return this._ref.updateSize(o,t),this}addPanelClass(o){return this._ref.addPanelClass(o),this}removePanelClass(o){return this._ref.removePanelClass(o),this}getState(){return this._state}_finishDialogClose(){this._state=J.CLOSED,this._ref.close(this._result,{focusOrigin:this._closeInteractionType}),this.componentInstance=null}};function me(i,o,t){return i._closeInteractionType=o,i.close(t)}var Oe=new g("MatMdcDialogData"),Ie=new g("mat-mdc-dialog-default-options"),Me=new g("mat-mdc-dialog-scroll-strategy",{providedIn:"root",factory:()=>{let i=a(h);return()=>Z(i)}}),ue=(()=>{class i{_defaultOptions=a(Ie,{optional:!0});_scrollStrategy=a(Me);_parentDialog=a(i,{optional:!0,skipSelf:!0});_idGenerator=a(R);_injector=a(h);_dialog=a(se);_animationsDisabled=mt();_openDialogsAtThisLevel=[];_afterAllClosedAtThisLevel=new p;_afterOpenedAtThisLevel=new p;dialogConfigClass=tt;_dialogRefConstructor;_dialogContainerType;_dialogDataToken;get openDialogs(){return this._parentDialog?this._parentDialog.openDialogs:this._openDialogsAtThisLevel}get afterOpened(){return this._parentDialog?this._parentDialog.afterOpened:this._afterOpenedAtThisLevel}_getAfterAllClosed(){let t=this._parentDialog;return t?t._getAfterAllClosed():this._afterAllClosedAtThisLevel}afterAllClosed=z(()=>this.openDialogs.length?this._getAfterAllClosed():this._getAfterAllClosed().pipe(q(void 0)));constructor(){this._dialogRefConstructor=H,this._dialogContainerType=ke,this._dialogDataToken=Oe}open(t,e){let n;e=u(u({},this._defaultOptions||new tt),e),e.id=e.id||this._idGenerator.getId("mat-mdc-dialog-"),e.scrollStrategy=e.scrollStrategy||this._scrollStrategy();let s=this._dialog.open(t,ft(u({},e),{positionStrategy:X(this._injector).centerHorizontally().centerVertically(),disableClose:!0,closePredicate:void 0,closeOnDestroy:!1,closeOnOverlayDetachments:!1,disableAnimations:this._animationsDisabled||e.enterAnimationDuration?.toLocaleString()==="0"||e.exitAnimationDuration?.toString()==="0",container:{type:this._dialogContainerType,providers:()=>[{provide:this.dialogConfigClass,useValue:e},{provide:b,useValue:e}]},templateContext:()=>({dialogRef:n}),providers:(l,r,m)=>(n=new this._dialogRefConstructor(l,e,m),n.updatePosition(e?.position),[{provide:this._dialogContainerType,useValue:m},{provide:this._dialogDataToken,useValue:r.data},{provide:this._dialogRefConstructor,useValue:n}])}));return n.componentRef=s.componentRef,n.componentInstance=s.componentInstance,this.openDialogs.push(n),this.afterOpened.next(n),n.afterClosed().subscribe(()=>{let l=this.openDialogs.indexOf(n);l>-1&&(this.openDialogs.splice(l,1),this.openDialogs.length||this._getAfterAllClosed().next())}),n}closeAll(){this._closeDialogs(this.openDialogs)}getDialogById(t){return this.openDialogs.find(e=>e.id===t)}ngOnDestroy(){this._closeDialogs(this._openDialogsAtThisLevel),this._afterAllClosedAtThisLevel.complete(),this._afterOpenedAtThisLevel.complete()}_closeDialogs(t){let e=t.length;for(;e--;)t[e].close()}static \u0275fac=function(e){return new(e||i)};static \u0275prov=G({token:i,factory:i.\u0275fac,providedIn:"root"})}return i})(),Ai=(()=>{class i{dialogRef=a(H,{optional:!0});_elementRef=a(I);_dialog=a(ue);ariaLabel;type="button";dialogResult;_matDialogClose;constructor(){}ngOnInit(){this.dialogRef||(this.dialogRef=pe(this._elementRef,this._dialog.openDialogs))}ngOnChanges(t){let e=t._matDialogClose||t._matDialogCloseResult;e&&(this.dialogResult=e.currentValue)}_onButtonClick(t){me(this.dialogRef,t.screenX===0&&t.screenY===0?"keyboard":"mouse",this.dialogResult)}static \u0275fac=function(e){return new(e||i)};static \u0275dir=k({type:i,selectors:[["","mat-dialog-close",""],["","matDialogClose",""]],hostVars:2,hostBindings:function(e,n){e&1&&L("click",function(l){return n._onButtonClick(l)}),e&2&&f("aria-label",n.ariaLabel||null)("type",n.type)},inputs:{ariaLabel:[0,"aria-label","ariaLabel"],type:"type",dialogResult:[0,"mat-dialog-close","dialogResult"],_matDialogClose:[0,"matDialogClose","_matDialogClose"]},exportAs:["matDialogClose"],features:[wt]})}return i})(),he=(()=>{class i{_dialogRef=a(H,{optional:!0});_elementRef=a(I);_dialog=a(ue);constructor(){}ngOnInit(){this._dialogRef||(this._dialogRef=pe(this._elementRef,this._dialog.openDialogs)),this._dialogRef&&Promise.resolve().then(()=>{this._onAdd()})}ngOnDestroy(){this._dialogRef?._containerInstance&&Promise.resolve().then(()=>{this._onRemove()})}static \u0275fac=function(e){return new(e||i)};static \u0275dir=k({type:i})}return i})(),wi=(()=>{class i extends he{id=a(R).getId("mat-mdc-dialog-title-");_onAdd(){this._dialogRef._containerInstance?._addAriaLabelledBy?.(this.id)}_onRemove(){this._dialogRef?._containerInstance?._removeAriaLabelledBy?.(this.id)}static \u0275fac=(()=>{let t;return function(n){return(t||(t=Q(i)))(n||i)}})();static \u0275dir=k({type:i,selectors:[["","mat-dialog-title",""],["","matDialogTitle",""]],hostAttrs:[1,"mat-mdc-dialog-title","mdc-dialog__title"],hostVars:1,hostBindings:function(e,n){e&2&&rt("id",n.id)},inputs:{id:"id"},exportAs:["matDialogTitle"],features:[O]})}return i})(),ki=(()=>{class i{static \u0275fac=function(e){return new(e||i)};static \u0275dir=k({type:i,selectors:[["","mat-dialog-content",""],["mat-dialog-content"],["","matDialogContent",""]],hostAttrs:[1,"mat-mdc-dialog-content","mdc-dialog__content"],features:[$([jt])]})}return i})(),Oi=(()=>{class i extends he{align;_onAdd(){this._dialogRef._containerInstance?._updateActionSectionCount?.(1)}_onRemove(){this._dialogRef._containerInstance?._updateActionSectionCount?.(-1)}static \u0275fac=(()=>{let t;return function(n){return(t||(t=Q(i)))(n||i)}})();static \u0275dir=k({type:i,selectors:[["","mat-dialog-actions",""],["mat-dialog-actions"],["","matDialogActions",""]],hostAttrs:[1,"mat-mdc-dialog-actions","mdc-dialog__actions"],hostVars:6,hostBindings:function(e,n){e&2&&E("mat-mdc-dialog-actions-align-start",n.align==="start")("mat-mdc-dialog-actions-align-center",n.align==="center")("mat-mdc-dialog-actions-align-end",n.align==="end")},inputs:{align:"align"},features:[O]})}return i})();function pe(i,o){let t=i.nativeElement.parentElement;for(;t&&!t.classList.contains("mat-mdc-dialog-container");)t=t.parentElement;return t?o.find(e=>e.id===t.id):null}function Se(i,o){if(i&1&&(C(0,"mat-icon"),D(1),v()),i&2){let t=d(2);P(t.iconCssComputed()),A(),x(" ",t.icon()," ")}}function Le(i,o){if(i&1&&(C(0,"span"),D(1),v()),i&2){let t=d(2);P(t.iconCssComputed()),A(),x(" ",t.icon()," ")}}function Ee(i,o){if(i&1&&(D(0),B(1,"translate")),i&2){let t=d(2);x(" ",F(1,1,t.buttonText())," ")}}function Pe(i,o){if(i&1&&D(0),i&2){let t=d(2);x(" ",t.buttonText().replace("button.","")," ")}}function Be(i,o){if(i&1){let t=st();C(0,"button",1),B(1,"translate"),L("click",function(){nt(t);let n=d();return ot(n.btnClick.emit())}),M(2,Se,2,3,"mat-icon",2)(3,Le,2,3,"span",2),M(4,Ee,2,3)(5,Pe,1,1),v()}if(i&2){let t=d();P(t.buttonCss()),lt("opacity",t.isDisabled()?"0.6":"1.0"),at("disabled",t.isDisabled())("matTooltip",F(1,11,t.buttonText()))("matTooltipDisabled",t.showTooltip())("appRtl",t.buttonCssComputed()),f("type",t.type()),A(2),S(t.iconType()==="icons"?2:3),A(2),S(t.translationRequired()?4:5)}}function Fe(i,o){if(i&1&&(D(0),B(1,"translate")),i&2){let t=d(2);x(" ",F(1,1,t.buttonText())," ")}}function Re(i,o){if(i&1&&D(0),i&2){let t=d(2);x(" ",t.buttonText().replace("button.","")," ")}}function Ne(i,o){if(i&1){let t=st();C(0,"button",1),B(1,"translate"),L("click",function(){nt(t);let n=d();return ot(n.btnClick.emit())}),M(2,Fe,2,3)(3,Re,1,1),v()}if(i&2){let t=d();P(t.buttonCss()),lt("opacity",t.isDisabled()?"0.6":"1.0"),at("disabled",t.isDisabled())("matTooltip",F(1,10,t.buttonText()))("matTooltipDisabled",t.showTooltip())("appRtl",t.buttonCssComputed()),f("type",t.type()),A(2),S(t.translationRequired()?2:3)}}var Gi=(()=>{class i{constructor(){this.loaderService=a(ee),this.textKey=c.required(),this.variant=c("primary"),this.icon=c(),this.showIcon=c(!0),this.translationRequired=c(!0),this.disabled=c(!1),this.type=c("button"),this.translatePath=c("button"),this.iconType=c("icons"),this.iconCss=c(),this.buttonCss=c(),this.btnClick=Et(),this.showTooltip=c(!0),this.requiresPrimaryLanguage=c(!1),this.#n=a(Jt),this.#o=a(te),this.#e=a(Yt),this.#t=a(V,{self:!0}),this.#i=Ut(Kt(this.requiresPrimaryLanguage).pipe(y(Boolean),vt(()=>this.#o.getByType(Bt.Primary).pipe(bt(t=>t[0]),Ct(()=>_t(void 0)))))),this.isBlockedByLanguage=_(()=>this.requiresPrimaryLanguage()&&this.#i()?.cultureName!==(this.#n.selectedLanguage()||this.#e.currentLang)),this.#a=At(()=>{let t=this.isBlockedByLanguage();this.#t.disabled=!t,t&&(this.#t.position="above",this.#t.message=this.#e.instant("translate.common.tooltip.switchToPrimaryLanguage",{language:this.#i()?.name??""}))}),this.isDisabled=_(()=>this.disabled()||this.loaderService.loading()||this.isBlockedByLanguage()),this.buttonText=_(()=>{let t=this.textKey();return t.includes(".")?t:`${this.translatePath()}.${t}`}),this.buttonCssComputed=_(()=>`osos-btn-common ${this.buttonVariantCss()}`),this.iconCssComputed=_(()=>`osos-btn-icon-common ${this.iconType()==="icons"?"material-icons-outlined":"material-symbols-outlined symbols-icon"} ${this.iconVariantCss()} ${this.iconCss()}`),this.buttonVariantCss=_(()=>{switch(this.variant()){case"primary":return"primary-btn";case"secondary":return"secondary-btn";case"success":return"approve-btn";case"warning":return"warning-secondary-btn";case"danger":return"warning-btn";case"warning-amber":return"warning-amber-btn";case"primary-v2":return"primary-btn-v2";case"secondary-v2":return"secondary-btn-v2";case"danger-v2":return"danger-v2-btn";case"danger-v3":return"danger-v3-btn";default:return"primary-btn"}}),this.iconVariantCss=_(()=>{switch(this.variant()){case"primary":case"danger":case"warning":case"warning-amber":case"success":return"primary-icon-color";case"secondary":return"secondary-icon-color";case"primary-v2":return"primary-icon-color-v2";case"secondary-v2":return"secondary-icon-color-v2";case"danger-v2":return"danger-icon-color";case"danger-v3":return"primary-icon-color";default:return"primary-icon-color"}})}#n;#o;#e;#t;#i;#a;static{this.\u0275fac=function(e){return new(e||i)}}static{this.\u0275cmp=w({type:i,selectors:[["osos-button-v1"]],hostVars:2,hostBindings:function(e,n){e&2&&E("inline-block",n.isBlockedByLanguage())},inputs:{textKey:[1,"textKey"],variant:[1,"variant"],icon:[1,"icon"],showIcon:[1,"showIcon"],translationRequired:[1,"translationRequired"],disabled:[1,"disabled"],type:[1,"type"],translatePath:[1,"translatePath"],iconType:[1,"iconType"],iconCss:[1,"iconCss"],buttonCss:[1,"buttonCss"],showTooltip:[1,"showTooltip"],requiresPrimaryLanguage:[1,"requiresPrimaryLanguage"]},outputs:{btnClick:"btnClick"},features:[$([V])],decls:2,vars:1,consts:[["mat-flat-button","","matTooltipPosition","below",3,"opacity","disabled","matTooltip","matTooltipDisabled","class","appRtl"],["mat-flat-button","","matTooltipPosition","below",3,"click","disabled","matTooltip","matTooltipDisabled","appRtl"],[3,"class"]],template:function(e,n){e&1&&M(0,Be,6,13,"button",0)(1,Ne,4,12,"button",0),e&2&&S(n.showIcon()?0:1)},dependencies:[Xt,$t,ie,ne,V,Zt],encapsulation:2})}}return i})();export{H as a,Oe as b,ue as c,Ai as d,wi as e,ki as f,Oi as g,Gi as h};
