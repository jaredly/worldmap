import * as React from 'react';
import { ColorPicker } from 'primereact/colorpicker';

export const ColorChange = ({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) => {
    return (
        <>
            <BlurInput value={value} onChange={onChange} />
            <ColorPicker
                value={value}
                onChange={(e) => {
                    onChange('#' + e.value);
                }}
            />
        </>
    );
};

export const BlurInput = ({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) => {
    const [text, setText] = React.useState(null as null | string);
    return (
        <input
            style={{ width: 50 }}
            value={text ?? value}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
                if (text) {
                    onChange(text);
                    setText(null);
                }
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && text != null) {
                    onChange(text);
                    setText(null);
                }
            }}
        />
    );
};
