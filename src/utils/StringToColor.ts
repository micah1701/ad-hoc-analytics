/**
 * Converts a string to a CSS-ready color representation.
 * 
 * Consistent per string: Each unique string always returns the same color.
 * Distinct colors: Different strings usually yield noticeably different hues.
 * Readable range: By fixing lightness and saturation ranges, it avoids too-light (like #F3F3F3) or too-dark values.
 * Easily adjustable: You can tweak saturation/lightness ranges for your theme—e.g., use slightly darker tones for dark backgrounds.
 * 
 * @param str String input to be converted to a color
 * @param as optional string to specify output format: 'hsl' (default), 'rgb' or 'hex'
 * @returns String Color representation in the specified format (HSL string, RGB as comma-separated values, or HEX string)
 * 
 * @author Micah Murray - github.com/micah1701 
 */
export default function StringToColor(str: string, as='hsl'): string {
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

    // Return as HSL string
    if (as === 'hsl') {
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    // Return as RGB (as comma-separated values) or HEX string
    return (as === 'rgb') ? hslToRgb(hue, saturation, lightness).join(", ") : hslToHex(hue, saturation, lightness);
}

function hslToRgb(h: number, s: number, l: number): number[] {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
       l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0), f(8), f(4)].map(x => Math.round(x * 255));
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

function hslToHex(h: number, s: number, l: number): string {
    const [r, g, b] = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
}

// Example usage:
// console.log(StringToColor("exampleString")); // e.g., "hsl(123, 70%, 50%)"
// console.log(StringToColor("exampleString", "rgb")); // e.g., "34, 139, 34"
// console.log(StringToColor("exampleString", "hex")); // e.g., "#228b22"