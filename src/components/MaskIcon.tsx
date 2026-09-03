interface MaskIconProps {
  src: string;
  color: string;
  size?: string;
  label?: string;
}

/** Icône SVG monochrome recolorée via CSS mask — fonctionne quelle que soit la couleur d'origine du fichier. */
export default function MaskIcon({ src, color, size = '1.1rem', label }: MaskIconProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
}
