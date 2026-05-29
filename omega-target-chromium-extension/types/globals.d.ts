declare var chrome: any;
declare var browser: any;
declare var angular: any;
declare var exports: any;
declare var FindProxyForURL: any;
declare var module: any;
declare var OmegaDebug: any;
declare var OmegaPac: any;
declare var OmegaTargetChromium: any;
declare var OmegaTargetPopup: any;
declare var saveAs: any;
declare function drawOmega(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  resultColor: string,
  profileColor?: string
): void;
declare function require(id: string): any;

interface Window {
  FindProxyForURL: any;
  OmegaContextMenuClickHandlers: any;
  OmegaContextMenuQuickSwitchHandler: any;
  OmegaDebug: any;
  OmegaTargetPopup: any;
  UglifyJS_NoUnsafeEval: boolean;
}
