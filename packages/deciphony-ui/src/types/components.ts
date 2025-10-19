declare module 'vue' {
    // GlobalComponents for Volar
    export interface GlobalComponents {
        DsIcon: (typeof import('deciphony-ui'))['DsIcon'];
        DsVideo: (typeof import('deciphony-ui'))['DsVideo'];
        DsProgressBar: (typeof import('deciphony-ui'))['DsProgressBar'];
        DsModelBox: (typeof import('deciphony-ui'))['DsModelBox'];
        DsFloatingWindow: (typeof import('deciphony-ui'))['DsFloatingWindow'];
        DsBgAudioPlayer: (typeof import('deciphony-ui'))['DsBgAudioPlayer'];
        DsWhiteboard: (typeof import('deciphony-ui'))['DsWhiteboard'];
        DsKeyboard: (typeof import('deciphony-ui'))['DsKeyboard'];
        DsPiano: (typeof import('deciphony-ui'))['DsPiano'];
    }

    // interface ComponentCustomProperties {
    //   $message: (typeof import('element-plus'))['ElMessage'];
    //   $notify: (typeof import('element-plus'))['ElNotification'];
    //   $msgbox: (typeof import('element-plus'))['ElMessageBox'];
    //   $messageBox: (typeof import('element-plus'))['ElMessageBox'];
    //   $alert: (typeof import('element-plus'))['ElMessageBox']['alert'];
    //   $confirm: (typeof import('element-plus'))['ElMessageBox']['confirm'];
    //   $prompt: (typeof import('element-plus'))['ElMessageBox']['prompt'];
    //   $loading: (typeof import('element-plus'))['ElLoadingService'];
    // }
}

export {};
