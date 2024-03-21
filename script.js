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

let navSpans = nav.querySelectorAll("span")
navSpans.forEach(span => {
  span.addEventListener("click", (evt) => {
    let newHref = "/"
    const targetText = (evt.target.innerText).toLowerCase()
    if (targetText != "home") {
      newHref = targetText
    }
    // window.location.href = newHref
    Swal.fire("Whoops!", "We're still working on our website. That page is coming soon!", "info")
  })
})

let buttons = document.querySelectorAll("button:not([data-save])")
buttons.forEach(btn => {
  btn.addEventListener("click", evt => {
    Swal.fire("Whoops!", "We're still working on our website. That page is coming soon!", "info")
  })
})