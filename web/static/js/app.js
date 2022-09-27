Zepto(function ($) {
  $(document).on('click', 'a.toggle', function (e) {
    e.preventDefault()
    $('ul.menu').toggle()
    return false
  })

  $(document).on('click', 'span.closer', function (e) {
    e.preventDefault()
    $(this).parent().parent().remove()
    return false
  })

  const dropArea = document.getElementById('upload-area')
  if (dropArea) {
    (function dragDrop () {
      ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false)
      })

      function preventDefaults (e) {
        e.preventDefault()
        e.stopPropagation()
      }

      ;['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false)
      })

      ;['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false)
      })

      function highlight (e) {
        dropArea.classList.add('highlight')
      }

      function unhighlight (e) {
        dropArea.classList.remove('highlight')
      }

      dropArea.addEventListener('drop', handleDrop, false)

      function handleDrop (e) {
        const dt = e.dataTransfer
        const files = dt.files

        handleFiles(files)
      }

      function handleFiles (files) {
        ([...files]).forEach(previewFile)
      }

      let _files = []

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
          }
        }
      }

      let filesDone = 0
      let filesToDo = 0
      const progressBar = document.getElementById('progress-bar')

      function initializeProgress (numFiles) {
        $('#progress-bar').show()
        progressBar.value = 0
        filesDone = 0
        filesToDo = numFiles
      }

      function progressDone () {
        filesDone++
        progressBar.value = filesDone / filesToDo * 100
        if (filesDone === filesToDo) {
          $('#progress-bar').hide()
          $('#upload-btn').show()
          $('#preview-area').children().remove()
          _files = []
        }
      }

      $(document).on('click', '#upload-btn', function (e) {
        initializeProgress(_files.length)
        $('#upload-btn').hide()
        e.preventDefault()
        ;[..._files].forEach(uploadFile)
        return false
      })

      function uploadFile (file) {
        const url = '/admin/photo-upload'
        const formData = new FormData()

        formData.append('file', file)

        fetch(url, {
          method: 'POST',
          body: formData
        })
          .then(() => { progressDone() })
          .catch(() => { /* Error. Inform the user */ })
      }
    })()
  }
})
