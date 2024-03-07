let nav = document.querySelector("nav")
nav.addEventListener("click", function() {
  if (nav.hasAttribute("data-closed")) {
    nav.removeAttribute("data-closed");
  } else {
    nav.setAttribute("data-closed", "true");
  }
})