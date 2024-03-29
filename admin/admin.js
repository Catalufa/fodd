let page = ""
window.pageHTML = null

import { Octokit } from "https://esm.sh/@octokit/rest";

window.octo = null
window.initGit = async function initGit(token) {
  console.log("AUTHTOKEN: " + token)
  octo = new Octokit({
    auth: token,
  })
}

async function get(forceCookie) {
  // page = await fetch("/")
  //   .then(response => response.text())
  let cookie = getCookie("token")
  if ((!cookie || cookie=="null") || forceCookie) {
    document.querySelector("#preload").style.display = "none";
    cookie = prompt("Enter your unique token")
  }
  if (!cookie) {
    window.location.reload()
  }
  await initGit(cookie)
  setCookie("token", cookie, 7)
  let resp = await octo.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: 'Catalufa',
    repo: 'fodd',
    path: 'index.html',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
      'If-None-Match': ''
    }
  })
    .catch(error => {
      alert("Invalid token")
      get(true)
    })
  console.log(resp.data.content)
  page = atob(resp.data.content)
  document.querySelector("#preload").style.display = "none";
  pageHTML = stringToHTML(page)
  let i = 0
  pageHTML.body.querySelectorAll("h1, h2, h3, h4, h5, h6, p, a, b, button").forEach(el => {
    i++
    el.setAttribute("data-editor-id", i)
  })
  let head = pageHTML.head.cloneNode(true)
  let body = pageHTML.body.cloneNode(true)
  document.querySelector("editor").appendChild(head)
  document.querySelector("editor").appendChild(body)
  document.querySelectorAll("editor [data-editor-id]").forEach(el => {
    el.setAttribute("contenteditable", "true")
    el.addEventListener("input", function() {
      update(this)
    })
  })
}

get()

var stringToHTML = function(str) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(str, 'text/html');
  return doc;
};

function update(refEl) {
  pageHTML.body.querySelector(`[data-editor-id="${refEl.getAttribute("data-editor-id")}"]`).innerText = refEl.innerText
}

document.querySelector("[data-save]").addEventListener("click", async function() {
  this.innerHTML = "Saving..."
  let cookie = getCookie("token")
  if (!cookie || cookie=="null") {
    document.querySelector("#preload").style.display = "none";
    cookie = prompt("Enter your unique token")
  }
  if (!cookie) {
    window.location.reload()
  }
  await initGit(cookie)
  setCookie("token", cookie, 7)
  let response = await updateFile(`<html><head>${pageHTML.head.innerHTML}</head><body>${pageHTML.body.innerHTML}</body></html>`)
  console.log(response)
  if (!response) {
    alert("Invalid token")
    deleteCookie("token")
    window.location.reload()
  }

  this.innerHTML = "Save"

})

async function updateFile(content) {
  const result = await octo.request('GET /repos/{owner}/{repo}/contents/{file_path}', {
    owner: "Catalufa", repo: "fodd", file_path: "index.html", branch: "main",
    headers: {
      'If-None-Match': ''
    }
  })

  try {
    await octo.rest.repos.createOrUpdateFileContents({
      owner: "Catalufa",
      repo: "fodd",
      path: "index.html",
      message: "Upload file",
      content: btoa(content),
      sha: result.data.sha
    })
    return true
  } catch {
    return false
  }
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

// function deleteCookie(name, path, domain) {
//   if (getCookie(name)) {
//     document.cookie = name + "=null"
//   }
// }

function deleteCookie(name) {   
  document.cookie = name+'=; Max-Age=-99999999;';  
}