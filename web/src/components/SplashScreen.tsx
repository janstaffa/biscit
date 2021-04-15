export interface SplashScreenProps {
  src: string;
  alt: string;
  caption?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ src, alt, caption }) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center absolute select-none">
      <div className="w-2/5 max-w-4xl flex flex-col">
        <img
          src={src}
          alt={alt}
          className="w-full opacity-20"
          draggable={false}
        />
        {caption && (
          <div className="text-center text-light-300 opacity-50 mt-5 text-base font-roboto">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
