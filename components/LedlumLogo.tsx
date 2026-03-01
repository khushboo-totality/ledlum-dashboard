export default function LedlumLogo({ 
  className = '', 
  white = false 
}: { 
  className?: string; 
  white?: boolean 
}) {
  return (
    <img 
      src={white ? "/LedlumWhiteLOGO.png" : "/LedlumLogo.png"} 
      alt="LEDLUM" 
      className={className} 
    />
  )
}
