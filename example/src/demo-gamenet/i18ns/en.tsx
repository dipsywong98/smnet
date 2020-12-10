import { gamenetI18n } from 'gamenet-material'
import React from 'react'

export const en = {
  ...gamenetI18n.en,
  poker99: 'poker99',
  howToPlay: 'How To Play',
  howToPlayContent: (
    <div>
      <h3>Control</h3>
      <div>
        Everyone have 5 cards at the beginning,
        the system will decide the beginning player,
        and then every player take turn to play card in clockwise direction,
        whenever play a card, you get one card back,
        unless playing cards with special functionality,
        points on card will add to the "BOMB" point,
        and "BOMB" can reach 99 point at max.
      </div>
      <h3>BOMB! condition</h3>
      <div>
        When a player cannot play any card that wont exceed 99 at his turn, he will be BOMB away!
      </div>
      <h3>Winning</h3>
      <div>You win if you are the only player left</div>
      <h3>Card rules</h3>
      <div>
        <ul>
          <li>1, 2, 3, 6, 7, 8, 9: Add the points on card to BOMB</li>
          <li>4: Reverse the turn direction(like clockwise-{'>'}anticlockwise)</li>
          <li>5: Change turn to any specific player except himself</li>
          <li>10: Plus or minus 10 to BOMB</li>
          <li>J: PASS</li>
          <li>Q: Plus or minus 20 to BOMB</li>
          <li>K: Set BOMB to 99</li>
          <li>Spade1: Set BOMB to 1</li>
        </ul>
      </div>
    </div>
  )
}
