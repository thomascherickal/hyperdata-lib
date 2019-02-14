const AKASHAComments = (function () {
  const CONF = {
    IPFSaddr: '/ip4/127.0.0.1/tcp/8080'
  }

  // main reference item for the thread
  const mainRef = 'https://twitter.com/AkashaProject/status/1085598391827120130'

  // list of external dependencies
  const DEPS = [
    'dist/Hyperdata.js',
    'https://unpkg.com/3box/dist/3box.min.js'
  ]

  // emulate indexing service for all comments
  const index = [
    'https://deiu.github.io/cdn/comment-ab019f3.jsonld',
    'ipfs://QmWsZJJgAA54Y9DYn1g7FtR8kgijgXeRqbfhnfggqAM36M',
    'ipfs://QmeFVNtUkFxA28mJGNoduRgnShgSzGAxD34C8N1FHtKy7g'
  ]

  // default element where we list comments
  let commentsElement
  let comments = []
  let web3js

  const initLayout = function (divID) {
    const main = document.getElementById(divID)

    // add style
    let style = document.createElement('style')
    style.innerHTML =
      `
      textarea {
        min-width: 400px;
        min-height: 200px;
        margin-bottom: 10px;
      }
      .comments-avatar {
        margin-right: 10px;
        -webkit-border-radius: 50%;
        -moz-border-radius: 50%;
        border-radius: 50%;
        height: 73px;
        width: 73px;
        float: left;
      }
      .comments-avatar img {
        position: relative;
        display: block;
        width: 100%;
        border-radius: 50%;
        z-index: -1;
      }
      .comments-user {
        border: 1px solid gray;
        min-width: 250px;
        min-height: 80px;
        margin: auto;
        overflow: auto;
        padding: 10px;
        box-shadow: 1px 1px 3px 1px grey;
      }
      .comments-user-pic {
        border-bottom: 2px solid gray;
      }
      .comments-body {
        margin-top: 10px;
        text-align: left;
      }
      .new-comment {
        margin-top: 20px;
        might-height: 100px;
      }
      .new-button {
        background-color: #fff;
        color: #777!important;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        font-size: 100%;
        padding: 1em 1.5em;
        text-decoration: none;
        border: 1px solid #777;
        border-radius: 2px;
        margin-right: 5px;
        cursor: pointer;
      }
      @media only screen
      and (min-width : 600px) {
        .comments-user-pic {
          border-right: 2px solid gray;
          float: left;
        }
        .comments-box {
          float: left;
          text-align: left;
        }
      }`
    document.body.appendChild(style)

    // create button
    const newButton = document.createElement('button')
    newButton.innerHTML = 'New comment'
    newButton.classList.add('new-button')
    newButton.addEventListener('click', function () {
      showDialog(newButton)
    })
    main.appendChild(newButton)

    // create element to store comments
    commentsElement = document.createElement('div')
    commentsElement.id = 'AKASHAComments'

    main.appendChild(commentsElement)
  }

  const showDialog = function (btn, ref, isReply) {
    const comment = document.createElement('div')
    comment.classList.add('new-comment')
    const textbox = document.createElement('textarea')
    comment.appendChild(textbox)
    comment.appendChild(document.createElement('br'))
    const submitBtn = document.createElement('button')
    submitBtn.innerHTML = 'Submit'
    submitBtn.classList.add('new-button')
    comment.appendChild(submitBtn)

    submitBtn.addEventListener('click', function () {
      getDIDfromETH(web3js.eth.defaultAccount).then(function (did) {
        let payload = {
          'type': (isReply) ? 'AKASHAReply' : 'AKASHAComment',
          'ref': ref || mainRef,
          'created': new Date().toISOString(),
          'author': did,
          'body': textbox.value
        }
        signData(payload).then(function (signature) {
          let data = {
            '@context': [
              'https://w3id.org/identity/v1',
              'https://akasha.org/contexts/comments.jsonld'
            ],
            'payload': payload,
            'proof': {
              'type': 'web3Signature',
              'creator': did,
              'signatureValue': signature
            }
          }
          console.log(data)

          // TODO write to IPFS

          // finally, remove the dialog div
          comment.remove()
        }).catch(function (err) {
          window.alert('Could not sign data. Check console.')
          console.error(err)
        })
      }).catch(function (err) {
        window.alert(`Could not retrieve your DID. Maybe you don't have a 3box account.`)
        console.error(err)
      })
    })

    // add elements to DOM
    console.log(btn)
    btn.parentNode.insertBefore(comment, btn.nextSibling)
  }

  // sign data using Metamask and ETH keys (using web3)
  const signData = function (data) {
    return new Promise(function (resolve, reject) {
      const hash = web3js.sha3(JSON.stringify(data))
      web3js.personal.sign(hash, web3js.eth.defaultAccount, function (err, signature) {
        if (err) {
          console.error(err)
          return reject(err)
        }
        return resolve(signature)
      })
    })
  }
  // verify signature (using web3)
  const verifySig = function (data, sig, id) {
    return new Promise(function (resolve, reject) {
      const hash = web3js.sha3(JSON.stringify(data))
      web3js.personal.ecRecover(hash, sig, function (err, result) {
        if (err) {
          return reject(err)
        }
        return (result === id) ? resolve(true) : resolve(false)
      })
    })
  }

  // const loadDeps = function (deps) {
  //   deps = deps || DEPS
  //   return new Promise(function (resolve, reject) {
  //     const injectScript = function (src) {
  //       return new Promise((resolve, reject) => {
  //         const script = document.createElement('script')
  //         script.src = src
  //         script.addEventListener('load', resolve)
  //         script.addEventListener('error', function () {
  //           reject(new Error('Error loading script.'))
  //         })
  //         script.addEventListener('abort', function () {
  //           reject(new Error('Script loading aborted.'))
  //         })
  //         var ref = window.document.getElementsByTagName('script')[0]
  //         ref.parentNode.insertBefore(script, ref)
  //       })
  //     }
  //     var promises = []
  //     for (var i = 0; i < DEPS.length; i++) {
  //       promises.push(injectScript(DEPS[i]))
  //     }
  //     Promise.all(promises).then(function () {
  //       return resolve
  //     }).catch(function (err) {
  //       return reject(err)
  //     })
  //   })
  // }

  const listItem = function (data) {
    // DID resolver
    // https://github.com/decentralized-identity/universal-resolver/blob/master/docs/api-definition.md
    // https://uniresolver.io/1.0/identifiers/did:sov:WRfXPg8dantKVubE3HX8pw

    if (!data || !data.payload) {
      return
    }
    data.payload.authorImage = data.payload.authorImage || 'favicon.png'
    data.payload.authorName = data.payload.authorName || 'anonymous'

    const comment = document.createElement('div')
    comment.setAttribute('style', 'margin-top: 2em;')
    comment.id = data.source

    let source = data.source
    if (source.indexOf('ipfs') >= 0) {
      source = 'http://127.0.0.1:8080/api/v0/cat?stream-channels=true&arg=' + source.substring(source.lastIndexOf('//') + 2, source.length)
    }

    comment.innerHTML = `<div class="comments-user"> 
      <img class="comments-avatar" src="${data.payload.authorImage}">
      <div class="comments-box">
        <h4 class="comments-body">${data.payload.body}</h4>
        By ${data.payload.authorName}<br>
        <small>On ${data.payload.created}</small><br>
        <small>Source: <a href="${source}">${data.source}</a></small>
      </div>
    </div>`

    const parent = document.getElementById(data.payload.ref)
    if (parent && data.payload.type === 'AKASHAReply') {
      comment.setAttribute('style', 'margin-left: 2em;')
      parent.appendChild(comment)
    } else {
      commentsElement.appendChild(comment)
      // add a spacer
      commentsElement.appendChild(document.createElement('br'))
    }
  }

  const toCommentsList = function (data) {
    comments.push(data)
    comments.sort(function (a, b) {
      return new Date(a.payload.created) - new Date(b.payload.created)
    })
    // clear list
    commentsElement.innerHTML = ''

    comments.forEach(function (comment) {
      listItem(comment)
    })
  }

  const getDIDfromETH = function (addr) {
    return new Promise(function (resolve, reject) {
      window.Box.getProfile(addr).then(profile => {
        return resolve(profile.ethereum_proof.linked_did)
      }).catch(function (err) {
        return reject(err)
      })
    })
  }

  const getDIDProfile = function (did) {
    return new Promise(function (resolve, reject) {
      if (!did || did.indexOf('did:muport') < 0) {
        return reject(new Error('Not a muport DID:', did))
      }
      const CID = did.substring(did.lastIndexOf(':') + 1, did.length)
      window.Hyperdata.Fetch('ipfs://' + CID).then(function (data) {
        if (data && data.managementKey) {
          window.Box.getProfile(data.managementKey).then(function (profile) {
            return resolve(profile)
          }).catch(function (err) {
            reject(err)
          })
        }
      }).catch(function (error) {
        // handle error
        console.log(error)
      })
    })
  }

  const init = function (divID, conf) {
    // set up the DOM for comments
    initLayout(divID)
    // init Metamask
    window.addEventListener('load', function () {
      // Checking if Web3 has been injected by the browser (Mist/MetaMask)
      if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        web3js = new window.Web3(window.web3.currentProvider)
      } else {
        console.log('You need Metamask to use this app in write mode!')
      }
      // Now you can start your app & access web3 freely:
      startApp(divID, conf)
    })
  }

  const startApp = function (divID, conf) {
    conf = conf || CONF

    // Init Hyperdata
    window.Hyperdata.IPFS.init(conf.IPFSaddr)
    console.log('Using IPFS node:', conf.IPFSaddr)

    index.forEach(function (url) {
      window.Hyperdata.Fetch(url).then(function (data) {
        if (data) {
          data.source = url
          getDIDProfile(data.payload.author).then(function (profile) {
            data.payload.authorDID = profile.ethereum_proof.linked_did
            if (profile.name) {
              data.payload.authorName = profile.name
            }
            if (profile.image) {
              data.payload.authorImage = 'https://ipfs.infura.io/ipfs/' + profile.image[0].contentUrl['/']
            }
            toCommentsList(data)
          }).catch(function (err) {
            console.log(err)
            toCommentsList(data)
          })
        }
      }).catch(function (err) {
        console.log('ERROR fetching:', err)
      })
    })
  }

  return {
    init
  }
})()
