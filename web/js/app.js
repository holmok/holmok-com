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
})
