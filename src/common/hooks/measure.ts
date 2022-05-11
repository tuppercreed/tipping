import { useEffect, useMemo, useState } from 'react';

export type UseMeasureRef<E extends Element = Element> = (element: E) => void;
export type UseMeasureResult<E extends Element = Element> = [UseMeasureRef<E>, number];

export function useMeasure<E extends Element = Element>(): UseMeasureResult<E> {
    const [element, ref] = useState<Element | null>(null);
    const [height, setHeight] = useState(0);

    const observer = useMemo(
        () => {
            if (typeof window !== 'undefined') {
                return new window.ResizeObserver((entries) => {
                    if (entries[0]) {
                        const { height } = entries[0].contentRect;
                        setHeight(height);
                    }
                });
            }
        }, []
    );

    useEffect(() => {
        if (!element) return;
        observer?.observe(element);

        return () => { observer?.disconnect(); };
    }, [element]);

    return [ref, height]
}