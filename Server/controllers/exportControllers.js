const Project = require('../models/Project');
const generatePDF = require('../services/pdfGenerator');

exports.exportPDF = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.presetId, userId: req.userId }
    });
    if (!project) return res.status(404).json({ message: 'Проект не найден' });
    if (!project.canvasJSON) return res.status(400).json({ message: 'Нет данных для экспорта' });

    const pdfBuffer = await generatePDF(project.canvasJSON);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="project-${project.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка генерации PDF', error: err.message });
  }
};