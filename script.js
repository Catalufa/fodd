let nav = document.querySelector("nav")
nav.addEventListener("click", function() {
  if (nav.hasAttribute("data-closed")) {
    nav.removeAttribute("data-closed");
  } else {
    nav.setAttribute("data-closed", "true");
  }
})

let photo = document.querySelector("#cover-middle")
document.addEventListener("mousemove", evt => {
    let center = document.body.clientWidth / 2
    let mouse = event.clientX - center
    photo.style.transform = `rotate(${5/document.body.clientWidth*mouse}deg)`
})