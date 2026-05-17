const Project = require('../models/Project');
const { generatePDF } = require('../services/pdfGenerator');

exports.exportPDF = async (req, res) => {
  try {
    // 1. Берем правильный параметр id из URL
    const projectId = req.params.id;
    
    // 2. Ищем проект в базе
    const project = await Project.findOne({
      where: { id: projectId, userId: req.userId }
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    
    // 3. ИСПРАВЛЕНО: Проверяем актуальное поле designSettings
    if (!project.designSettings) {
      return res.status(400).json({ message: 'Проект пуст, нет данных для экспорта' });
    }

    // 4. Передаем данные в генератор PDF (передаем весь объект проекта)
    const pdfBuffer = await generatePDF(project);

    // 5. Отправляем PDF обратно в браузер
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="project-${project.id}.pdf"`);
    res.send(pdfBuffer);
    
  } catch (err) {
    console.error("Ошибка при экспорте:", err);
    res.status(500).json({ message: 'Ошибка генерации PDF', error: err.message });
  }
};