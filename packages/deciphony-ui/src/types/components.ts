declare module 'vue' {
    // GlobalComponents for Volar
    export interface GlobalComponents {
        HlIcon: (typeof import('deciphony-ui'))['HlIcon'];
        HlVideo: (typeof import('deciphony-ui'))['HlVideo'];
        HlProgressBar: (typeof import('deciphony-ui'))['HlProgressBar'];
        DsModelBox: (typeof import('deciphony-ui'))['DsModelBox'];
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
