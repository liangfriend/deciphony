declare module 'vue' {
  // GlobalComponents for Volar
  export interface GlobalComponents {
    HlIcon: (typeof import('@jsh/halo-ui'))['HlIcon'];
    HlVideo: (typeof import('@jsh/halo-ui'))['HlVideo'];
    HlProgressBar: (typeof import('@jsh/halo-ui'))['HlProgressBar'];
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
