/* global u, FileReader, FormData, alert */

document.addEventListener('DOMContentLoaded', runApp, false)

function runApp () {
  // toggle menu
  u('a.toggle').handle('click', function (e) {
    const hidden = u('ul.menu').hasClass('hidden')
    console.log(`click: ${hidden}`)
    if (hidden) {
      u('ul.menu').removeClass('hidden')
    } else {
      u('ul.menu').addClass('hidden')
    }
  })

  // close flash message
  const closer = u('span.closer')
  const hasCloser = closer.length > 0
  if (hasCloser) {
    closer.handle('click', function (e) {
      u(this).parent().parent().remove()
    })
  }

  // drag and drop
  const dropArea = u('#upload-area')
  const hasDropArea = dropArea.length > 0
  if (hasDropArea) {
    let _files = []
    dropArea.handle('dragenter,dragover', function (e) {
      dropArea.addClass('highlight')
    })

    dropArea.handle('dragleave,drop', function (e) {
      dropArea.removeClass('highlight')
    })

    dropArea.on('drop', function (e) {
      e.preventDefault()
      e.stopPropagation()
      const files = e.dataTransfer.files;
      ([...files]).forEach(previewFile)
    })

    function previewFile (file) {
      if (file.type.startsWith('image/') && file.size < 100 * 1024 * 1024) {
        const ext = file.name.split('.').pop().toLowerCase()
        if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'tif' || ext === 'tiff') {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          _files.push(file)
          reader.onloadend = function () {
            const img = document.createElement('img')
            img.src = reader.result
            img.classList.add('preview')
            document.getElementById('preview-area').appendChild(img)
          }
          return
        }
      }
      alert(`File ${file.name} is not a valid image or is too large.`)
    }

    let filesDone = 0
    let filesToDo = 0
    const progressBar = u('#progress-bar')

    function initializeProgress (numFiles) {
      progressBar.removeClass('hidden')
      progressBar.attr('value', 0)
      filesDone = 0
      filesToDo = numFiles
    }

    function updateProgress () {
      filesDone++
      progressBar.value = filesDone / filesToDo * 100
      if (filesDone === filesToDo) {
        progressBar.addClass('hidden')
        u('#upload-btn').removeClass('hidden')
        u('#preview-area').children().remove()
        _files = []
      }
    }

    u('#upload-btn').handle('click', function (e) {
      initializeProgress(_files.length)
      u('#upload-btn').addClass('hidden');
      ([..._files]).forEach(uploadFile)
    })

    function uploadFile (file) {
      const url = '/admin/photo-upload'
      const formData = new FormData()
      formData.append('file', file)
      fetch(url, {
        method: 'POST',
        body: formData
      })
        .then(() => { updateProgress() })
        .catch((error) => {
          alert(error.message)
          console.error(error)
        })
    }
  }
}
