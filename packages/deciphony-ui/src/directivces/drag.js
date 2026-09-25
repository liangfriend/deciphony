const drag = {
    mounted(el, binding) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        const getLimitRect = () => {
            const parent = el.parentElement;
            if (!parent)
                return null;
            return parent.getBoundingClientRect();
        };
        const onPointerDown = (e) => {
            if (!binding.value?.enabled)
                return;
            isDragging = true;
            el.setPointerCapture(e.pointerId);
            const computedStyle = getComputedStyle(el);
            offsetX = e.clientX - parseInt(computedStyle.left);
            offsetY = e.clientY - parseInt(computedStyle.top);
            el.addEventListener('pointermove', onPointerMove);
            el.addEventListener('pointerup', onPointerUp);
        };
        const onPointerMove = (e) => {
            if (!isDragging)
                return;
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;
            const axis = binding.value?.axis ?? 'both';
            const limit = binding.value?.limit ?? false;
            if (limit) {
                const rect = getLimitRect();
                if (rect) {
                    const elRect = el.getBoundingClientRect();
                    const parentWidth = rect.width;
                    const parentHeight = rect.height;
                    // 👇 根据 axis 限制不同方向
                    if (axis === 'x' || axis === 'both') {
                        newLeft = Math.max(0, Math.min(newLeft, parentWidth - elRect.width));
                    }
                    if (axis === 'y' || axis === 'both') {
                        newTop = Math.max(0, Math.min(newTop, parentHeight - elRect.height));
                    }
                }
            }
            if (axis !== 'y') {
                el.style.left = `${newLeft}px`;
            }
            if (axis !== 'x') {
                el.style.top = `${newTop}px`;
            }
        };
        const onPointerUp = (e) => {
            if (!isDragging)
                return;
            isDragging = false;
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', onPointerUp);
        };
        el.addEventListener('pointerdown', onPointerDown);
        el._dragData = { onPointerDown };
    },
    updated(el, binding) {
        const data = el._dragData;
        if (!data)
            return;
        if (binding.value?.enabled) {
            el.addEventListener('pointerdown', data.onPointerDown);
        }
        else {
            el.removeEventListener('pointerdown', data.onPointerDown);
        }
    },
    unmounted(el) {
        const data = el._dragData;
        if (data) {
            el.removeEventListener('pointerdown', data.onPointerDown);
        }
    }
};
export default drag;
