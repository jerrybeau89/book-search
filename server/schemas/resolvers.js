const { User } = require('../models');
const { AuthenticationError } = require('apollo-server-express')
const { signToken, authMiddleware } = require('../utils/auth');


const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id })
        .populate('savedBooks');
      }
      throw new AuthenticationError('Please log in to access your information.');
    },
  },
  Mutation: {
    
    login: async (parent, { email, password }) => {
    
      const user = await User.findOne({ email });
        if (!user) {
          throw new AuthenticationError('No user found or credentials incorrect, please try again.');
        }
      const pwIsCorrect = await user.isCorrectPassword(password);
        if (!pwIsCorrect) {
          throw new AuthenticationError('Incorrect password, try again.');
        }
      const token = signToken(user);

      if (!user && !token){
        throw new AuthenticationError('Sorry, something went wrong.')
      }
        return { token, user };
    },

    addUser: async (parent, args) => {

      const user = await User.create(args);
      const token = signToken(user);
      if (!user && !token){
        throw new AuthenticationError('Sorry, something went wrong.')
      }
      return { token, user };
    },

    saveBook: async (parent, { input }, context) => {

      if (context.user) {
        const usersBooks = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: input } },
          { new: true }
        );
        return usersBooks;
        } 
        throw new AuthenticationError('Sorry, something went wrong.');
    },

    removeBook: async (parent, { bookId }, context) => {

      if (context.user) {
        const userBook = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
        return userBook;
      }
      throw new AuthenticationError('Sorry, something went wrong.');
    }
  }
};

module.exports = resolvers;