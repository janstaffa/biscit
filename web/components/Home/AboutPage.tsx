export interface AboutPageProps {}

const AboutPage: React.FC<AboutPageProps> = () => {
  return (
    <div className="w-screen h-auto bg-dark-200">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
        <path
          fill="#0e1116"
          fill-opacity="1"
          d="M0,64L80,69.3C160,75,320,85,480,85.3C640,85,800,75,960,64C1120,53,1280,43,1360,37.3L1440,32L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"
        ></path>
      </svg>
      <div className="w-1/2 h-80 mx-auto rounded-3xl p-10 bg-dark-300">
        <p
          className="text-light text-3xl font-opensans font-bold text-center mb-2"
          id="about"
        >
          About Biscit
        </p>
        <p className="text-light text-xl font-opensans text-center">
          Biscit is a open source project. It is a chat application with a lot
          of inspiration from Discord.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
