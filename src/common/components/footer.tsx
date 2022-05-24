import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function Footer() {
    return (
        <footer className="text-xs p-0.5  bottom-0 bg-teal-100 flex justify-center items-baseline gap-1">
            <p>© Lindsay Tupper-Creed</p>
            <a href='https://github.com/tuppercreed/tipping' target='_blank'><FontAwesomeIcon icon={faGithub} /></a>
            <p>MIT licensed</p>
        </footer>
    )
}