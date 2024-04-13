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
    window.location.href = newHref
    // Swal.fire("Whoops!", "We're still working on our website. That page is coming soon!", "info")
  })
})

fetch("https://corsproxy.io/?https%3A%2F%2Ffetchrss.com%2Frss%2F661a64e4d2d9ca71f230a082661a64b5f78c3c185e2727d2.atom")
  .then(response => response.text())
  .then(xml => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml,"text/xml");
  entries = xmlDoc.querySelectorAll("entry")
  entries.forEach(e => {
      document.querySelector("#about-cards").appendChild(e)
  })
document.querySelectorAll("[type='html']").forEach(el => {
    var parsedHtml = parser.parseFromString(el.innerHTML, 'text/html');
    
    // Now, parsedHtml contains the parsed HTML as a document object
    let newText = parsedHtml.body.innerText;
    try {
      let newTitle = temp1.innerHTML.split("#")[1].split("<br>")[0];
      newTextList = newText.split("<br>")
      newTextList.shift()
      newText = newTextList.join("<br>")
      el.parentElement.querySelector("title").innerText = newTitle
    } catch {}
    el.innerHTML = newText
})
document.querySelectorAll("updated").forEach(el => {
    el.innerHTML = pDate(el.innerHTML).Formatted
})

})

document.body.addEventListener("click", e => {
  if (e.target.tagName == "entry") {
    e.target.classList.add("open")
  }
})

const pDate=(d)=>(f=new Date(d))&&{Formatted:f.toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'numeric',minute:'numeric',hour12:true})};