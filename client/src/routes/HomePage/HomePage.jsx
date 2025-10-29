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
        <h2>Supercharge your creativity and productivity</h2>
        <h3>Hello this is an H3 text.</h3>
        <Link to="/dashboard" className="get-started-btn">
          Get Started
        </Link>
      </div>

      <div className="right">
        <div className="imgContainer">
          <div className="bgContainer">
            <div className="bg"></div>
          </div>
          <img src="/walking-duck.gif" alt="" className="bot" />
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
                'Bob: We produce food for Ducks',
                2000, () => {
                  setTypingStatus("bot");
                },
                'Goose: We produce food for Geese',
                2000, () => {
                  setTypingStatus("human2");
                },
                'We produce food for Swans',
                2000, () => {
                  setTypingStatus("bot");
                },
                'We produce food for Chicken',
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
