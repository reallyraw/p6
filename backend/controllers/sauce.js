const Sauce = require('../models/sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => { 
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
    const sauce = new Sauce({
      ...sauceObject,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  sauce.save().then(
    () => {
      res.status(201).json({
        message: 'Nouvelle sauce créée!'
      });
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
      {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      } : { ...req.body };
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: 'Sauce modifiée !'}))
      .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Sauce supprimée !'}))
            .catch(error => res.status(400).json({ error }));
        });
      })
      .catch(error => res.status(500).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find().then(
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.reviewSauce = async (req, res, next) => {
  const { userId, like } = req.body;
  const { id } = req.params;

  switch (like) {
    case 1:
      return Sauce.updateOne({ _id: id }, { $push: { usersLiked: userId }, $inc: { likes: 1 } })
        .then(() => res.status(200).json({ message: "Vous aimez cette sauce !" }))
        .catch((error) => res.status(400).json({error}));
    case 0:
      const sauce = await Sauce.findOne({ _id: id });
      if (sauce.usersLiked.includes(userId)) {
        return Sauce.updateOne({ _id: id }, { $pull: { usersLiked: userId }, $inc: { likes: -1 } })
          .then(() => res.status(200).json({ messages: "Vous avez retiré votre like" }))
          .catch((error) => res.status(400).json({ error }));
      } else if (sauce.usersDisliked.includes(userId)) {
        return Sauce.updateOne({ _id: id }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } })
          .then(() => res.status(200).json({ message: "Vous avez retiré votre dislike" }))
          .catch((error) => res.status(400).json({ error }));
      } else {
        return res
          .status(400)
          .json({ error: "Il n'y avait pas d'avis venant de cet utilisateur." });
      }

    case -1:
      return Sauce.updateOne({ _id: id }, { $push: { usersDisliked: userId }, $inc: { dislikes: 1 } })
        .then(() => res.status(200).json({ message: "Vous n'aimez pas cette sauce." }))
        .catch((error) => res.status(400).json(error));
    default:
      res.status(400).json({ error });
  }
};