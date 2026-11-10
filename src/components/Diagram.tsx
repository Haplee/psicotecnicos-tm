import type { VisualKind } from '../data/questions'

export function Diagram({ kind }: { kind: VisualKind }) {
  if (kind === 'cube-net') return (
    <div className="diagram-wrap" aria-label="Desarrollo plano de un cubo con caras A, B, C, D, E y F">
      <svg viewBox="0 0 330 165" role="img" className="diagram-svg">
        <g fill="#242127" stroke="#A97989" strokeWidth="1.5">
          <rect x="110" y="4" width="52" height="52" rx="5"/><rect x="58" y="56" width="52" height="52" rx="5"/><rect x="110" y="56" width="52" height="52" rx="5"/><rect x="162" y="56" width="52" height="52" rx="5"/><rect x="214" y="56" width="52" height="52" rx="5"/><rect x="110" y="108" width="52" height="52" rx="5"/>
        </g>
        <g fill="#F2EFF1" fontSize="17" fontWeight="700" textAnchor="middle" dominantBaseline="middle">
          <text x="136" y="30">A</text><text x="84" y="82">B</text><text x="136" y="82">C</text><text x="188" y="82">D</text><text x="240" y="82">E</text><text x="136" y="134">F</text>
        </g>
      </svg>
      <span className="diagram-caption">Desarrollo plano · cada cuadrado representa una cara</span>
    </div>
  )
  if (kind === 'lever') return (
    <div className="diagram-wrap" aria-label="Esquema de palanca con carga a la izquierda y esfuerzo a la derecha">
      <svg viewBox="0 0 340 125" className="diagram-svg" role="img">
        <path d="M36 66 H304" stroke="#B98A99" strokeWidth="7" strokeLinecap="round"/>
        <path d="M161 72 L143 105 H179 Z" fill="#713448" stroke="#D9A7B6" strokeWidth="1.5"/>
        <rect x="42" y="30" width="44" height="34" rx="5" fill="#713448" stroke="#D9A7B6"/><path d="M64 8 V26 M58 20 L64 27 L70 20" stroke="#D9A7B6" strokeWidth="2" fill="none"/>
        <path d="M276 14 V57 M270 49 L276 58 L282 49" stroke="#D9A7B6" strokeWidth="2" fill="none"/>
        <g fill="#F2EFF1" fontSize="12" textAnchor="middle"><text x="64" y="22">100 N</text><text x="276" y="9">F</text><text x="160" y="119">Apoyo</text><text x="103" y="87">0,20 m</text><text x="226" y="87">0,50 m</text></g>
      </svg>
      <span className="diagram-caption">Palanca en equilibrio · momentos a ambos lados del apoyo</span>
    </div>
  )
  if (kind === 'pulley') return (
    <div className="diagram-wrap" aria-label="Esquema de polea fija con cuerda y carga">
      <svg viewBox="0 0 340 150" className="diagram-svg" role="img">
        <path d="M90 12 H250" stroke="#77717A" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="170" cy="58" r="26" fill="#242127" stroke="#D9A7B6" strokeWidth="4"/><circle cx="170" cy="58" r="5" fill="#D9A7B6"/>
        <path d="M144 58 V114 H196 V58" stroke="#B98A99" strokeWidth="3" fill="none"/>
        <rect x="148" y="114" width="44" height="25" rx="4" fill="#713448" stroke="#D9A7B6"/>
        <path d="M196 58 V18" stroke="#B98A99" strokeWidth="3"/><path d="M190 27 L196 17 L202 27" stroke="#D9A7B6" fill="none" strokeWidth="2"/>
        <g fill="#F2EFF1" fontSize="12"><text x="206" y="24">Esfuerzo</text><text x="200" y="132">Carga</text><text x="35" y="58">Polea fija</text></g>
      </svg>
      <span className="diagram-caption">Polea fija ideal · cambia la dirección de la fuerza</span>
    </div>
  )
  if (kind === 'gears') return (
    <div className="diagram-wrap" aria-label="Dos engranajes externos de distinto tamaño engranados">
      <svg viewBox="0 0 340 140" className="diagram-svg" role="img">
        <g fill="#713448" stroke="#D9A7B6" strokeWidth="2"><circle cx="130" cy="70" r="45"/><circle cx="220" cy="70" r="24"/></g>
        <g stroke="#D9A7B6" strokeWidth="4" strokeLinecap="round"><path d="M130 18 V29 M130 111 V122 M78 70 H89 M171 70 H182 M93 33 L101 41 M159 99 L167 107 M93 107 L101 99 M159 41 L167 33"/><path d="M220 40 V48 M220 92 V100 M190 70 H198 M242 70 H250 M199 49 L205 55 M235 85 L241 91 M199 91 L205 85 M235 55 L241 49"/></g>
        <g fill="#F2EFF1" fontSize="12" textAnchor="middle"><text x="130" y="75">A</text><text x="220" y="75">B</text><text x="130" y="134">Engranaje A</text><text x="220" y="134">Engranaje B</text></g>
        <path d="M105 12 C80 5 73 31 86 42" stroke="#D9A7B6" strokeWidth="2" fill="none"/><path d="M81 34 L86 43 L93 36" fill="none" stroke="#D9A7B6" strokeWidth="2"/>
      </svg>
      <span className="diagram-caption">Engranajes externos · giran en sentidos opuestos</span>
    </div>
  )
  if (kind === 'matrix') return (
    <div className="diagram-wrap" aria-label="Matriz de tres casillas con cantidad creciente de puntos">
      <svg viewBox="0 0 330 108" className="diagram-svg" role="img">
        {[0,1,2].map((n) => <g key={n}><rect x={18+n*105} y="7" width="88" height="88" rx="8" fill="#242127" stroke="#A97989" strokeWidth="1.5"/>{Array.from({length:n+1},(_,i)=><circle key={i} cx={62+(i%2)*22-11} cy={51+Math.floor(i/2)*20-10} r="6" fill="#D9A7B6"/>)}</g>)}
      </svg>
      <span className="diagram-caption">Ejemplo de regla visual: aumenta la cantidad de puntos</span>
    </div>
  )
  if (kind === 'shading-sequence') return (
    <div className="diagram-wrap" aria-label="Secuencia de círculos: vacío, medio sombreado, lleno, medio sombreado inverso, vacío">
      <svg viewBox="0 0 330 78" className="diagram-svg" role="img">
        {[38,102,166,230,294].map((cx, index) => <g key={index}>
          <circle cx={cx} cy="35" r="22" fill="#242127" stroke="#D9A7B6" strokeWidth="2"/>
          {index === 1 && <path d={`M ${cx} 13 A 22 22 0 0 0 ${cx} 57 Z`} fill="#D9A7B6"/>}
          {index === 2 && <circle cx={cx} cy="35" r="20" fill="#D9A7B6"/>}
          {index === 3 && <path d={`M ${cx} 13 A 22 22 0 0 1 ${cx} 57 Z`} fill="#D9A7B6"/>}
        </g>)}
      </svg>
      <span className="diagram-caption">El sombreado alterna entre vacío, mitad izquierda, lleno y mitad derecha</span>
    </div>
  )
  if (kind === 'sequence') return (
    <div className="diagram-wrap" aria-label="Secuencia de figuras geométricas alternas">
      <svg viewBox="0 0 330 76" className="diagram-svg" role="img">
        <g stroke="#D9A7B6" strokeWidth="2" fill="#713448">
          <path d="M32 54 L48 22 L64 54 Z"/><rect x="91" y="22" width="32" height="32" rx="2"/><path d="M160 54 L176 22 L192 54 Z"/><rect x="219" y="22" width="32" height="32" rx="2"/><path d="M288 54 L304 22 L320 54 Z"/>
        </g>
      </svg>
      <span className="diagram-caption">Observa la repetición de forma y posición</span>
    </div>
  )
  return (
    <div className="diagram-wrap" aria-label="Cuadrícula de símbolos para ejercicio de atención">
      <div className="symbol-grid"><span>△</span><span>○</span><span>□</span><span>△</span><span>○</span><span>△</span></div>
      <span className="diagram-caption">Compara forma y frecuencia de cada símbolo</span>
    </div>
  )
}
