var express = require('express');
var router = express.Router();

const students = {
  student1: {
    first_name: 'Анжеліка',
    last_name: 'Возняк'
  },
  student2: {
    first_name: 'Іван',
    last_name: 'Гаран'
  },
  student3: {
    first_name: 'Софія',
    last_name: 'Кінчур'
  },
  student4: {
    first_name: 'Валерія',
    last_name: 'Король'
  }
};

router.get('/:studentId', function(req, res, next) {
  const studentId = req.params.studentId;
  const student = students[studentId];

  if (student) {
    res.render('student', {student});
  } else {
    res.status(404).send('Студент не знайдений')
  }
});

module.exports = router;
