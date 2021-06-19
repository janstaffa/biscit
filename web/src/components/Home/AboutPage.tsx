export interface AboutPageProps {}

const AboutPage: React.FC<AboutPageProps> = () => {
  return (
    <div className="w-screen h-auto bg-dark-200 py-24" id="about">
      <div className="w-full h-auto py-10 flex flex-row justify-center flex-wrap sm:flex-nowrap">
        <div className="mx-8 mb-8">
          <img src="/chat_image.svg" className="w-96" />
        </div>
        <div className="mx-8 mb-8">
          <p className="text-light text-3xl font-opensans font-bold text-left mb-2">About Biscit</p>
          <div className="text-light text-xl w-full max-w-xl break-words">
            Biscit is an open source project. It is a chat application with a lot of inspiration from Discord. The
            development has started back in 2020 and went through three major iterations.
          </div>
        </div>
      </div>
      <div className="w-full h-auto py-10 mt-32 flex flex-row justify-center flex-wrap-reverse sm:flex-nowrap">
        <div className="mx-8 mb-8">
          <p className="text-light text-3xl font-opensans font-bold text-left mb-2" id="about">
            Availability
          </p>
          <div className="text-light text-xl w-full max-w-xl break-words">
            Currently Biscit is available just as a web app, but in the near future we are planning to introduce a
            desktop as well as a mobile app.
          </div>
        </div>
        <div className="mx-8 mb-8">
          <img src="/pwa_image.svg" className="w-96" />
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
