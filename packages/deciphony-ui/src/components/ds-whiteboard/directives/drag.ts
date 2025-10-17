const drag = {
    mounted(el: HTMLElement, binding: { value: boolean }) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        const onPointerDown = (e: PointerEvent) => {
            if (!binding.value) return;
            isDragging = true;
            el.setPointerCapture(e.pointerId);

            const computedStyle = getComputedStyle(el);
            offsetX = e.clientX - parseInt(computedStyle.left);
            offsetY = e.clientY - parseInt(computedStyle.top);

            el.addEventListener('pointermove', onPointerMove);
            el.addEventListener('pointerup', onPointerUp);
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!isDragging) return;
            el.style.left = `${e.clientX - offsetX}px`;
            el.style.top = `${e.clientY - offsetY}px`;
        };

        const onPointerUp = (e: PointerEvent) => {
            if (!isDragging) return;
            isDragging = false;
            // 手指离开范围也能继续触发事件，好像没什么用
            // el.releasePointerCapture(e.pointerId);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', onPointerUp);
        };

        el.addEventListener('pointerdown', onPointerDown);
        (el as any)._dragData = {onPointerDown};
    },

    updated(el: HTMLElement, binding: { value: boolean; oldValue: boolean }) {
        if (binding.value === binding.oldValue) return;
        const data = (el as any)._dragData;
        if (!data) return;

        if (binding.value) {
            el.addEventListener('pointerdown', data.onPointerDown);
        } else {
            el.removeEventListener('pointerdown', data.onPointerDown);
        }
    },

    unmounted(el: HTMLElement) {
        const data = (el as any)._dragData;
        if (data) {
            el.removeEventListener('pointerdown', data.onPointerDown);
        }
    },
};

export default drag;
