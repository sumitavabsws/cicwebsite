import Hero from "../components/Hero"
import Stats from "../components/Stats"
import Infrastructure from "../components/Infrastructure"
import Timeline from "../components/Timeline"
import AboutCIC from "../components/AboutCIC"
import { useEffect, useRef } from "react"

function Home(){
const timelineSnapRef = useRef(null)

useEffect(() => {
const root = document.documentElement
root.classList.add("home-scroll-snap")

const updateSnapRelease = () => {
const timelineTop = timelineSnapRef.current?.offsetTop

if (typeof timelineTop !== "number") {
return
}

root.classList.toggle("home-scroll-snap-release", window.scrollY >= timelineTop - 156)
}

updateSnapRelease()
window.addEventListener("scroll", updateSnapRelease, { passive: true })
window.addEventListener("resize", updateSnapRelease)

return () => {
root.classList.remove("home-scroll-snap")
root.classList.remove("home-scroll-snap-release")
window.removeEventListener("scroll", updateSnapRelease)
window.removeEventListener("resize", updateSnapRelease)
}
}, [])

return(

<div className="bg-slate-50">

<section className="flex min-h-[calc(100vh-156px)] snap-start snap-always flex-col overflow-hidden">
<Hero compact/>

<Stats/>
</section>

<div className="snap-start snap-always">
<AboutCIC/>
</div>

<div className="snap-start snap-always">
<Infrastructure/>
</div>

<div ref={timelineSnapRef} className="snap-start snap-always">
<Timeline/>
</div>

</div>

)

}

export default Home
