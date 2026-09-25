import type { DirectiveBinding } from 'vue';
interface DragOptions {
    enabled: boolean;
    axis?: 'x' | 'y' | 'both';
    limit?: boolean;
}
declare const drag: {
    mounted(el: HTMLElement, binding: DirectiveBinding<DragOptions>): void;
    updated(el: HTMLElement, binding: DirectiveBinding<DragOptions>): void;
    unmounted(el: HTMLElement): void;
};
export default drag;
