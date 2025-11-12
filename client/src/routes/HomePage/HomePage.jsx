import { Link } from 'react-router-dom'
import { TypeAnimation } from 'react-type-animation';
import { useState } from "react";
import './HomePage.css'

const HomePage = () => {

  const [typingStatus, setTypingStatus] = useState("human1")

  return (
    <div className="homepage">
      <img src="/orbital.png" alt="" className="orbital" />

      <div className="left">
        <h1>Talk Talk Goose</h1>
        <h2>Waddle into smarter conversations.</h2>
        <h3>Goose around with an AI that will answer your questions!</h3>
        <Link to="/dashboard" className="get-started-btn">
          Get Started
        </Link>
      </div>

      <div className="right">
        <div className="imgContainer">
          <div className="bgContainer">
            <div className="bg"></div>
          </div>
          <img src="/goose-walk.gif" alt="" className="bot" />
          <div className="chat">
            <img 
              src={
                typingStatus === "human1" 
                  ? "/human1.jpeg" 
                  : typingStatus === "human2" 
                  ? "/human2.jpeg" 
                  : "goose-honk.gif"
              } alt="" 
            />
            <TypeAnimation 
              sequence={[
                "What's your favorite food?",
                2000, () => {
                  setTypingStatus("bot");
                },
                'Cheese and quackers!',
                2000, () => {
                  setTypingStatus("human2");
                },
                'What language are you fluent in?',
                2000, () => {
                  setTypingStatus("bot");
                },
                'Portu-geese!',
                2000, () => {
                  setTypingStatus("human1");
                },
              ]}
              wrapper="span"
              repeat={Infinity}
              cursor={true}
              omitDeletionAnimation={true}
            />
          </div>
        </div>
      </div>
      <div className="terms">
        <img src="/logo.png" alt="" />
        <div className="links">
          <Link to="/">Terms of Service</Link>
          <span>|</span>
          <Link to="/">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage
