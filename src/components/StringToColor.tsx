export default function StringToColor(str: string, asHSL: boolean = false): string {
    // Simple string hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Map hash to hue (0-360)
    const hue = Math.abs(hash) % 360;

    // Keep saturation and lightness in readable ranges
    const saturation = 60 + (Math.abs(hash) % 20); // 60–80%
    const lightness = 45 + (Math.abs(hash) % 15); // 45–60%

    // Return as HSL string (CSS compatible)
    if (asHSL) {
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    // Return as RGB string (CSS compatible)
    const [r, g, b] = hslToRgb(hue, saturation, lightness);
    return `rgb(${r}, ${g}, ${b})`;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) {
        r = c; g = x;
    } else if (h < 120) {
        r = x; g = c;
    } else if (h < 180) {
        g = c; b = x;
    } else if (h < 240) {
        g = x; b = c;
    } else if (h < 300) {
        r = x; b = c;
    } else {
        r = c; b = x;
    }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}